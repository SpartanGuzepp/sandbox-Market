// Everything an agent can do, in one place. The REST API (/api/v1) and the MCP endpoint (/api/mcp)
// both call these functions, so they behave identically: same checks, same traps, same activity log.
import { desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db/client";
import { merchants, orders } from "@/db/schema";
import type { AgentIdentity } from "@/lib/api/auth";
import { ApiError, notFound } from "@/lib/api/errors";
import { AddItemBody, CheckoutBody, SearchQuery, UpdateItemBody } from "@/lib/api/schemas";
import { cartJson, cartSummaryJson, merchantJson, orderJson, productDetailJson, productSummaryJson } from "@/lib/api/serialisers";
import { cartHash, signCartHash } from "@/lib/cart/hash";
import { addItem, createCart, getCartView, loadCart, removeAddon, removeItem, updateItemQuantity } from "@/lib/cart/service";
import { getMerchant, getProduct, listMerchants, searchProducts } from "@/lib/catalogue";
import { CATEGORIES } from "@/lib/categories";
import { config } from "@/lib/env";
import { logEvent } from "@/lib/events";
import { formatMoney, parseMajor } from "@/lib/money";
import { getOrderWithAuth } from "@/lib/orders";
import { checkoutCart } from "@/lib/payments/checkout";
import { activeTrapsFor } from "@/lib/traps";

export type OpContext = { agent: AgentIdentity; origin: string; via: "api" | "mcp" };

const actor = (c: OpContext) => ({ type: "agent" as const, id: c.agent.id, name: c.agent.name });

export async function opSearchProducts(c: OpContext, input: z.input<typeof SearchQuery>) {
  const params = SearchQuery.parse(input);
  const maxPriceMinor = params.max_price !== undefined ? parseMajor(params.max_price) : undefined;
  if (maxPriceMinor === null) throw new ApiError(400, "invalid_request", "max_price must be a number in euros.");
  const { total, items } = await searchProducts({
    q: params.q,
    category: params.category,
    maxPriceMinor,
    colour: params.colour,
    size: params.size,
    merchantId: params.merchant_id,
    sort: params.sort,
    limit: params.limit,
    offset: params.offset,
  });
  await logEvent({
    actor: actor(c),
    type: "product.searched",
    summary: `Searched products${params.q ? ` for "${params.q}"` : ""} (${total} results)`,
    data: { query: params, total, via: c.via },
  });
  return { total, limit: params.limit, offset: params.offset, items: items.map((p) => productSummaryJson(p, c.origin)) };
}

export async function opGetProduct(c: OpContext, id: string) {
  const product = await getProduct(id);
  if (!product) throw notFound("Product", id);
  await logEvent({
    actor: actor(c),
    type: "product.viewed",
    summary: `Viewed ${product.title} (${product.merchant.name})`,
    data: { product_id: id, merchant_id: product.merchantId, active_traps: await activeTrapsFor(id, product.merchantId), via: c.via },
  });
  return productDetailJson(product, c.origin);
}

export async function opListMerchants(c: OpContext) {
  return { items: (await listMerchants()).map((m) => merchantJson(m, c.origin)) };
}

export async function opGetMerchant(c: OpContext, id: string) {
  const m = await getMerchant(id);
  if (!m) throw notFound("Merchant", id);
  await logEvent({ actor: actor(c), type: "merchant.viewed", summary: `Viewed merchant ${m.name}`, data: { merchant_id: id, via: c.via } });
  return merchantJson(m, c.origin);
}

export function opListCategories() {
  return { items: CATEGORIES };
}

export async function opCreateCart(c: OpContext) {
  const cart = await createCart({ channel: "api", agentKeyId: c.agent.id });
  await logEvent({ actor: actor(c), type: "cart.created", cartId: cart.id, summary: `Created cart ${cart.id}`, data: { via: c.via } });
  return cartJson(await getCartView(cart), c.origin);
}

export async function opGetCart(c: OpContext, cartId: string) {
  const cart = await loadCart(cartId, { agentKeyId: c.agent.id });
  return cartJson(await getCartView(cart), c.origin);
}

export async function opAddItem(c: OpContext, cartId: string, input: z.input<typeof AddItemBody>) {
  const body = AddItemBody.parse(input);
  const cart = await loadCart(cartId, { agentKeyId: c.agent.id });
  const { itemId, product } = await addItem(cart, { productId: body.product_id, quantity: body.quantity, size: body.size });
  const view = await getCartView(await loadCart(cartId));
  await logEvent({
    actor: actor(c),
    type: "cart.item_added",
    cartId,
    summary: `Added ${body.quantity} × ${product.title}${body.size ? ` (size ${body.size})` : ""}, cart total ${formatMoney(view.breakdown.totalMinor, view.breakdown.currency ?? "EUR")}`,
    data: {
      item_id: itemId,
      product_id: product.id,
      quantity: body.quantity,
      size: body.size ?? null,
      cart_total_minor: view.breakdown.totalMinor,
      active_traps: await activeTrapsFor(product.id, product.merchantId),
      via: c.via,
    },
  });
  return cartJson(view, c.origin);
}

export async function opUpdateItem(c: OpContext, cartId: string, itemId: string, input: z.input<typeof UpdateItemBody>) {
  const body = UpdateItemBody.parse(input);
  const cart = await loadCart(cartId, { agentKeyId: c.agent.id });
  await updateItemQuantity(cart, itemId, body.quantity);
  await logEvent({
    actor: actor(c),
    type: "cart.item_updated",
    cartId,
    summary: `Changed quantity of ${itemId} to ${body.quantity}`,
    data: { item_id: itemId, quantity: body.quantity, via: c.via },
  });
  return cartJson(await getCartView(await loadCart(cartId)), c.origin);
}

export async function opRemoveItem(c: OpContext, cartId: string, itemId: string) {
  const cart = await loadCart(cartId, { agentKeyId: c.agent.id });
  const removed = await removeItem(cart, itemId);
  await logEvent({
    actor: actor(c),
    type: "cart.item_removed",
    cartId,
    summary: `Removed ${removed.productId} from cart`,
    data: { item_id: itemId, product_id: removed.productId, via: c.via },
  });
  return cartJson(await getCartView(await loadCart(cartId)), c.origin);
}

export async function opRemoveAddon(c: OpContext, cartId: string, code: string) {
  const cart = await loadCart(cartId, { agentKeyId: c.agent.id });
  await removeAddon(cart, code);
  await logEvent({ actor: actor(c), type: "cart.addon_removed", cartId, summary: `Removed optional add-on '${code}'`, data: { code, via: c.via } });
  return cartJson(await getCartView(await loadCart(cartId)), c.origin);
}

export async function opGetSummary(c: OpContext, cartId: string) {
  const cart = await loadCart(cartId, { agentKeyId: c.agent.id });
  const view = await getCartView(cart, "checkout");
  const hash = cartHash(view);
  return cartSummaryJson(view, hash, signCartHash(hash, config.cartSigningSecret()), c.origin);
}

/** Returns the order and the HTTP status the REST API uses: 201 placed, 202 awaiting approval, 402 declined. */
export async function opCheckout(c: OpContext, cartId: string, input: z.input<typeof CheckoutBody>) {
  const body = CheckoutBody.parse(input);
  const cart = await loadCart(cartId, { agentKeyId: c.agent.id });
  const { order } = await checkoutCart(cart, {
    cardToken: body.card_token,
    expectedCartHash: body.expected_cart_hash,
    actor: actor(c),
    channel: "api",
    agentKeyId: c.agent.id,
  });
  const full = (await getOrderWithAuth(order.id))!;
  const status = order.status === "placed" ? 201 : order.status === "awaiting_customer_approval" ? 202 : 402;
  return { status, order: orderJson(full.order, full.merchantName, full.auth, c.origin) };
}

export async function opListOrders(c: OpContext) {
  const rows = await db
    .select({ order: orders, merchantName: merchants.name })
    .from(orders)
    .leftJoin(merchants, eq(orders.merchantId, merchants.id))
    .where(eq(orders.agentKeyId, c.agent.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);
  return {
    items: rows.map((r) =>
      orderJson(r.order, r.merchantName, r.order.decision ? { decision: r.order.decision, reason: r.order.decisionReason ?? "" } : null, c.origin),
    ),
  };
}

export async function opGetOrder(c: OpContext, orderId: string) {
  const full = await getOrderWithAuth(orderId);
  if (!full || full.order.agentKeyId !== c.agent.id) throw notFound("Order", orderId);
  return orderJson(full.order, full.merchantName, full.auth, c.origin);
}
