// Cart hash and signature.
// The hash is a fingerprint of exactly what will be charged. The signature (HMAC) proves the
// summary came from Sandbox Market. The leash can compare the hash in the authorisation request
// with the summary the agent showed the customer.
import { createHash, createHmac } from "node:crypto";
import type { CartView } from "./service";

/** Canonical form: fixed key order, cents only, no timestamps. Same cart = same hash. */
export function canonicalCart(view: CartView) {
  const b = view.breakdown;
  return {
    cart_id: view.cart.id,
    merchant_id: view.cart.merchantId,
    currency: b.currency,
    lines: b.lines.map((l) => ({
      product_id: l.productId,
      size: l.size,
      quantity: l.quantity,
      unit_price_minor: l.unitPriceMinor,
      is_recurring: l.isRecurring,
    })),
    shipping_minor: b.shippingMinor,
    fees: b.fees.map((f) => ({ code: f.code, amount_minor: f.amountMinor })),
    addons: b.addons.map((a) => ({ code: a.code, amount_minor: a.amountMinor })),
    total_minor: b.totalMinor,
  };
}

export function cartHash(view: CartView): string {
  return "sha256:" + createHash("sha256").update(JSON.stringify(canonicalCart(view))).digest("hex");
}

export function signCartHash(hash: string, secret: string): string {
  return "hmac-sha256:" + createHmac("sha256", secret).update(hash).digest("hex");
}
