// Checkout: turn an open cart into a payment through the normal payment pipeline.
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { carts, products, type Cart, type OrderSnapshot } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { cartHash } from "@/lib/cart/hash";
import { getCartView, type CartView } from "@/lib/cart/service";
import type { Actor } from "@/lib/events";
import { validateCardToken } from "./card-token";
import { processPayment } from "./process";

export async function snapshotOf(view: CartView): Promise<OrderSnapshot> {
  const b = view.breakdown;
  const ids = b.lines.map((l) => l.productId);
  const cats = ids.length
    ? await db.select({ id: products.id, category: products.category }).from(products).where(inArray(products.id, ids))
    : [];
  const catOf = new Map(cats.map((c) => [c.id, c.category]));
  return {
    lines: b.lines.map((l) => ({
      product_id: l.productId,
      title: l.title,
      category: catOf.get(l.productId) ?? "unknown",
      size: l.size,
      quantity: l.quantity,
      unit_price_minor: l.unitPriceMinor,
      line_total_minor: l.lineTotalMinor,
      is_recurring: l.isRecurring,
    })),
    subtotal_minor: b.subtotalMinor,
    shipping_minor: b.shippingMinor,
    fees: b.fees.map((f) => ({ code: f.code, label: f.label, amount_minor: f.amountMinor })),
    addons: b.addons.map((a) => ({ code: a.code, label: a.label, amount_minor: a.amountMinor })),
    total_minor: b.totalMinor,
  };
}

export async function checkoutCart(
  cart: Cart,
  opts: { cardToken: unknown; expectedCartHash?: string; actor: Actor; channel: "api" | "web"; agentKeyId: string | null },
) {
  const cardToken = validateCardToken(opts.cardToken);
  if (cart.status === "awaiting_approval") {
    throw new ApiError(409, "cart_awaiting_approval", "A payment for this cart is already waiting for the customer's approval.");
  }
  if (cart.status !== "open") throw new ApiError(409, "cart_not_open", `Cart '${cart.id}' is ${cart.status}.`);

  const view = await getCartView(cart, "checkout");
  if (!view.breakdown.lines.length || !cart.merchantId || !view.breakdown.currency) {
    throw new ApiError(409, "cart_empty", "The cart is empty.");
  }
  const hash = cartHash(view);
  if (opts.expectedCartHash && opts.expectedCartHash !== hash) {
    throw new ApiError(409, "cart_changed", "The cart no longer matches expected_cart_hash. Fetch the summary again.", {
      expected_cart_hash: opts.expectedCartHash,
      current_cart_hash: hash,
    });
  }

  // Lock the cart so the same cart can't be paid twice at the same time.
  const locked = await db
    .update(carts)
    .set({ status: "checking_out", updatedAt: new Date() })
    .where(and(eq(carts.id, cart.id), eq(carts.status, "open")))
    .returning();
  if (!locked.length) throw new ApiError(409, "cart_not_open", "This cart is already being checked out.");

  try {
    return await processPayment({
      kind: "checkout",
      channel: opts.channel,
      actor: opts.actor,
      agentKeyId: opts.agentKeyId,
      cartId: cart.id,
      merchantId: cart.merchantId,
      snapshot: await snapshotOf(view),
      currency: view.breakdown.currency,
      cardToken,
      cartHash: hash,
      isRecurring: view.breakdown.recurring.length > 0,
      initiator: opts.channel === "api" ? "customer_agent" : "customer_web",
    });
  } catch (e) {
    await db.update(carts).set({ status: "open" }).where(and(eq(carts.id, cart.id), eq(carts.status, "checking_out")));
    throw e;
  }
}
