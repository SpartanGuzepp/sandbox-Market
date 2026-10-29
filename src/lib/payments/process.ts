// The payment pipeline used by checkout, subscription renewals and merchant-initiated charges.
//   1. create an order (pending_authorisation)
//   2. build the authorisation request and ask the PaymentAuthoriser
//   3. store request + response, log the decision
//   4. approve -> placed | decline -> declined | step_up -> awaiting_customer_approval
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { carts, merchants, orders, authorisations, subscriptions, type Order, type OrderSnapshot } from "@/db/schema";
import { ApiError, notFound } from "@/lib/api/errors";
import { config } from "@/lib/env";
import { logEvent, type Actor } from "@/lib/events";
import { newId } from "@/lib/ids";
import { formatMoney } from "@/lib/money";
import { getAuthoriser, type AuthorisationRequest } from "./authoriser";
import { maskToken } from "./card-token";

export type PaymentInput = {
  kind: "checkout" | "renewal" | "merchant_initiated";
  channel: "api" | "web" | "system";
  actor: Actor;
  agentKeyId: string | null;
  cartId: string | null;
  merchantId: string;
  snapshot: OrderSnapshot;
  currency: string;
  cardToken: string;
  cartHash: string | null;
  isRecurring: boolean;
  initiator: AuthorisationRequest["initiator"];
  subscriptionId?: string | null;
};

const AUTH_ACTOR_NAME = { no_leash: "No leash (built-in)", http: "Leash" } as const;

function addInterval(d: Date, interval: string) {
  const n = new Date(d);
  if (interval === "month") n.setMonth(n.getMonth() + 1);
  else n.setDate(n.getDate() + 30);
  return n;
}

export async function processPayment(input: PaymentInput) {
  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, input.merchantId));
  if (!merchant) throw notFound("Merchant", input.merchantId);
  const total = input.snapshot.total_minor;
  const money = formatMoney(total, input.currency);

  // 1. Order
  const [order] = await db
    .insert(orders)
    .values({
      id: newId("ord"),
      kind: input.kind,
      cartId: input.cartId,
      channel: input.channel,
      agentKeyId: input.agentKeyId,
      merchantId: merchant.id,
      status: "pending_authorisation",
      currency: input.currency,
      totalMinor: total,
      snapshot: input.snapshot,
      cardToken: input.cardToken,
      cartHash: input.cartHash,
      isRecurring: input.isRecurring,
      subscriptionId: input.subscriptionId ?? null,
    })
    .returning();

  await logEvent({
    actor: input.actor,
    type: input.kind === "checkout" ? "checkout.attempted" : "charge.attempted",
    cartId: input.cartId,
    orderId: order.id,
    summary:
      input.kind === "checkout"
        ? `Checkout: pay ${money} to ${merchant.name}`
        : `${merchant.name} charges ${money} to stored card ${maskToken(input.cardToken)}${input.kind === "renewal" ? " (subscription renewal)" : " (merchant-initiated)"}`,
    data: { order_id: order.id, merchant_id: merchant.id, total_minor: total, currency: input.currency, kind: input.kind },
  });

  // 2. Authorisation request
  const request: AuthorisationRequest = {
    request_id: newId("authreq"),
    timestamp: new Date().toISOString(),
    card_token: input.cardToken,
    amount_minor: total,
    amount: (total / 100).toFixed(2),
    currency: input.currency,
    merchant_id: merchant.id,
    merchant_name: merchant.name,
    merchant_mcc: merchant.mcc,
    merchant_country: merchant.country === "XX" ? null : merchant.country,
    merchant_joined_at: merchant.joinedAt.toISOString(),
    is_recurring: input.isRecurring,
    initiator: input.initiator,
    order_id: order.id,
    cart_id: input.cartId,
    cart_hash: input.cartHash,
  };
  if (config.sendBasketDetails()) {
    request.line_items = input.snapshot.lines.map((l) => ({
      product_id: l.product_id,
      title: l.title,
      category: l.category,
      size: l.size,
      quantity: l.quantity,
      unit_price_minor: l.unit_price_minor,
      line_total_minor: l.line_total_minor,
      is_recurring: l.is_recurring,
    }));
    request.shipping_minor = input.snapshot.shipping_minor;
    request.fees = input.snapshot.fees;
    request.addons = input.snapshot.addons;
  }

  const authoriser = getAuthoriser();
  const result = await authoriser.authorise(request);

  // 3. Record it
  await db.insert(authorisations).values({
    id: request.request_id,
    orderId: order.id,
    authoriser: result.authoriser,
    request: request as unknown as Record<string, unknown>,
    response: result.response,
    decision: result.decision,
    reason: result.reason,
    httpStatus: result.httpStatus,
    error: result.error,
    latencyMs: result.latencyMs,
  });
  await logEvent({
    actor: { type: "authoriser", id: result.authoriser, name: AUTH_ACTOR_NAME[result.authoriser] },
    type: "authorisation.result",
    cartId: input.cartId,
    orderId: order.id,
    summary: `${result.decision.toUpperCase()}: ${money} to ${merchant.name}. Reason: ${result.reason}`,
    data: {
      request_id: request.request_id,
      decision: result.decision,
      reason: result.reason,
      authoriser: result.authoriser,
      amount_minor: total,
      currency: input.currency,
      merchant_id: merchant.id,
      basket_details_sent: config.sendBasketDetails(),
      latency_ms: result.latencyMs,
    },
  });

  // 4. Act on the decision
  await db
    .update(orders)
    .set({ decision: result.decision, decisionReason: result.reason, updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  let final: Order;
  if (result.decision === "approve") {
    final = await placeOrder(order.id, input.actor);
  } else if (result.decision === "step_up") {
    [final] = await db
      .update(orders)
      .set({ status: "awaiting_customer_approval", updatedAt: new Date() })
      .where(eq(orders.id, order.id))
      .returning();
    if (input.cartId) await db.update(carts).set({ status: "awaiting_approval", updatedAt: new Date() }).where(eq(carts.id, input.cartId));
    await logEvent({
      actor: { type: "system", name: "Sandbox Market" },
      type: "order.awaiting_customer_approval",
      cartId: input.cartId,
      orderId: order.id,
      summary: `Waiting for the customer to approve ${money} to ${merchant.name} in their banking app`,
      data: { order_id: order.id },
    });
  } else {
    [final] = await db.update(orders).set({ status: "declined", updatedAt: new Date() }).where(eq(orders.id, order.id)).returning();
    if (input.cartId) await db.update(carts).set({ status: "open", updatedAt: new Date() }).where(eq(carts.id, input.cartId));
    await logEvent({
      actor: { type: "system", name: "Sandbox Market" },
      type: "order.declined",
      cartId: input.cartId,
      orderId: order.id,
      summary: `Payment declined: ${money} to ${merchant.name}`,
      data: { order_id: order.id, reason: result.reason },
    });
  }
  return { order: final, authorisation: { id: request.request_id, ...result } };
}

/** Mark an order as placed and do the follow-up work (close cart, start or renew subscriptions). */
async function placeOrder(orderId: string, actor: Actor): Promise<Order> {
  const [order] = await db.update(orders).set({ status: "placed", updatedAt: new Date() }).where(eq(orders.id, orderId)).returning();
  if (order.cartId) await db.update(carts).set({ status: "checked_out", updatedAt: new Date() }).where(eq(carts.id, order.cartId));

  const now = new Date();
  if (order.kind === "checkout") {
    for (const l of order.snapshot.lines.filter((x) => x.is_recurring)) {
      await db.insert(subscriptions).values({
        id: newId("sub"),
        orderId: order.id,
        productId: l.product_id,
        merchantId: order.merchantId,
        title: l.title,
        amountMinor: l.line_total_minor,
        currency: order.currency,
        cardToken: order.cardToken,
        interval: "month",
        nextRenewalAt: addInterval(now, "month"),
      });
    }
  }
  if (order.kind === "renewal" && order.subscriptionId) {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, order.subscriptionId));
    if (sub) await db.update(subscriptions).set({ nextRenewalAt: addInterval(sub.nextRenewalAt, sub.interval) }).where(eq(subscriptions.id, sub.id));
  }

  const [m] = await db.select({ name: merchants.name }).from(merchants).where(eq(merchants.id, order.merchantId));
  await logEvent({
    actor,
    type: "order.placed",
    cartId: order.cartId,
    orderId: order.id,
    summary: `Order placed: ${formatMoney(order.totalMinor, order.currency)} to ${m?.name ?? order.merchantId}`,
    data: { order_id: order.id, total_minor: order.totalMinor, currency: order.currency, kind: order.kind },
  });
  return order;
}

/** The customer answers a step-up request in their (simulated) banking app. */
export async function customerDecision(orderId: string, approve: boolean) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw notFound("Order", orderId);
  if (order.status !== "awaiting_customer_approval") {
    throw new ApiError(409, "not_awaiting_approval", `Order '${orderId}' is ${order.status}, not awaiting approval.`);
  }
  const customer: Actor = { type: "customer", name: "Customer (banking app)" };
  const money = formatMoney(order.totalMinor, order.currency);
  if (approve) {
    await logEvent({ actor: customer, type: "order.customer_approved", cartId: order.cartId, orderId, summary: `Customer approved ${money}` });
    return placeOrder(orderId, customer);
  }
  const [updated] = await db
    .update(orders)
    .set({ status: "rejected_by_customer", updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "awaiting_customer_approval")))
    .returning();
  if (order.cartId) await db.update(carts).set({ status: "open", updatedAt: new Date() }).where(eq(carts.id, order.cartId));
  await logEvent({ actor: customer, type: "order.customer_rejected", cartId: order.cartId, orderId, summary: `Customer rejected ${money}` });
  return updated;
}

export async function refundOrder(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw notFound("Order", orderId);
  if (order.status !== "placed") throw new ApiError(409, "not_refundable", `Only placed orders can be refunded (this one is ${order.status}).`);
  const [updated] = await db.update(orders).set({ status: "refunded", updatedAt: new Date() }).where(eq(orders.id, orderId)).returning();
  await logEvent({
    actor: { type: "admin", name: "Admin" },
    type: "order.refunded",
    cartId: order.cartId,
    orderId,
    summary: `Refunded ${formatMoney(order.totalMinor, order.currency)}`,
    data: { order_id: orderId, amount_minor: order.totalMinor, currency: order.currency },
  });
  return updated;
}
