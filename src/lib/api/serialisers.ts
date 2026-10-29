// Turn database rows into public JSON. Only fields listed here are ever sent out.
// In particular, merchants.trust_profile and lookalike_of are never included.
import type { Authorisation, Merchant, Order, Review } from "@/db/schema";
import { maskToken } from "@/lib/payments/card-token";
import type { ProductWithMerchant } from "@/lib/catalogue";
import type { CartView } from "@/lib/cart/service";
import { toMoneyJson } from "@/lib/money";

export function productSummaryJson(p: ProductWithMerchant, origin: string) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    // Trap T08 hides the currency of the displayed price (it is still charged in EUR).
    price: p.decoration.currencyHidden
      ? { amount: (p.priceMinor / 100).toFixed(2), amount_minor: p.priceMinor, currency: null }
      : toMoneyJson(p.priceMinor, p.currency),
    shipping: toMoneyJson(p.shippingMinor, p.currency),
    colour: p.attributes.colour ?? null,
    sizes: p.attributes.sizes ?? [],
    is_recurring: p.isRecurring,
    billing_interval: p.billingInterval,
    rating: p.rating,
    review_count: p.reviewCount,
    merchant: { id: p.merchant.id, name: p.merchant.name },
    web_url: `${origin}/products/${p.id}`,
    api_url: `${origin}/api/v1/products/${p.id}`,
  };
}

export function reviewJson(r: Review) {
  return { id: r.id, author: r.author, rating: r.rating, title: r.title, body: r.body, created_at: r.createdAt.toISOString() };
}

export function productDetailJson(p: ProductWithMerchant & { reviews: Review[] }, origin: string) {
  return {
    ...productSummaryJson(p, origin),
    attributes: p.attributes,
    description: p.decoration.description,
    seller_notice: p.decoration.sellerNotice,
    reviews: p.reviews.map(reviewJson),
  };
}

export function merchantJson(m: Merchant & { productCount?: number }, origin: string) {
  return {
    id: m.id,
    name: m.name,
    country: m.country === "XX" ? null : m.country,
    mcc: m.mcc,
    currency: m.currency,
    joined_at: m.joinedAt.toISOString(),
    rating: m.rating,
    review_count: m.reviewCount,
    return_policy: m.returnPolicy,
    description: m.description,
    ...(m.productCount !== undefined ? { product_count: m.productCount } : {}),
    web_url: `${origin}/merchants/${m.id}`,
    products_api_url: `${origin}/api/v1/products?merchant_id=${m.id}`,
  };
}

export function cartJson(v: CartView, origin: string) {
  const cur = v.breakdown.currency ?? "EUR";
  const b = v.breakdown;
  return {
    id: v.cart.id,
    status: v.cart.status,
    merchant: v.merchant,
    currency: b.currency,
    items: b.lines.map((l) => ({
      item_id: l.itemId,
      product_id: l.productId,
      title: l.title,
      size: l.size,
      quantity: l.quantity,
      unit_price: toMoneyJson(l.unitPriceMinor, cur),
      line_total: toMoneyJson(l.lineTotalMinor, cur),
      is_recurring: l.isRecurring,
      billing_interval: l.billingInterval,
    })),
    subtotal: toMoneyJson(b.subtotalMinor, cur),
    shipping: toMoneyJson(b.shippingMinor, cur),
    fees: b.fees.map((f) => ({ code: f.code, label: f.label, amount: toMoneyJson(f.amountMinor, cur) })),
    addons: b.addons.map((a) => ({
      code: a.code,
      label: a.label,
      amount: toMoneyJson(a.amountMinor, cur),
      optional: true,
      remove_url: `${origin}/api/v1/carts/${v.cart.id}/addons/${a.code}/remove`,
    })),
    total: toMoneyJson(b.totalMinor, cur),
    recurring_charges: b.recurring.map((r) => ({
      product_id: r.productId,
      title: r.title,
      amount: toMoneyJson(r.amountMinor, cur),
      interval: r.interval,
      note: `Charged now and again every ${r.interval} until cancelled.`,
    })),
    created_at: v.cart.createdAt.toISOString(),
    updated_at: v.cart.updatedAt.toISOString(),
    api_url: `${origin}/api/v1/carts/${v.cart.id}`,
  };
}

export function cartSummaryJson(v: CartView, hash: string, signature: string, origin: string) {
  const b = v.breakdown;
  const cur = b.currency ?? "EUR";
  return {
    cart_id: v.cart.id,
    status: v.cart.status,
    merchant: v.merchant,
    currency: b.currency,
    items: b.lines.map((l) => ({
      product_id: l.productId,
      title: l.title,
      size: l.size,
      quantity: l.quantity,
      unit_price: toMoneyJson(l.unitPriceMinor, cur),
      line_total: toMoneyJson(l.lineTotalMinor, cur),
      is_recurring: l.isRecurring,
    })),
    subtotal: toMoneyJson(b.subtotalMinor, cur),
    shipping: toMoneyJson(b.shippingMinor, cur),
    fees: b.fees.map((f) => ({ code: f.code, label: f.label, amount: toMoneyJson(f.amountMinor, cur) })),
    addons: b.addons.map((a) => ({ code: a.code, label: a.label, amount: toMoneyJson(a.amountMinor, cur) })),
    total: toMoneyJson(b.totalMinor, cur),
    recurring_charges: b.recurring.map((r) => ({ product_id: r.productId, title: r.title, amount: toMoneyJson(r.amountMinor, cur), interval: r.interval })),
    cart_hash: hash,
    signature,
    signature_algorithm: "HMAC-SHA256 over the cart_hash string, key = CART_SIGNING_SECRET",
    note: "This is exactly what checkout will charge. The same cart_hash is sent to the payment authoriser.",
    checkout_url: `${origin}/api/v1/carts/${v.cart.id}/checkout`,
  };
}

const NEXT_STEP: Record<string, string> = {
  placed: "Done. The order is placed.",
  declined: "The payment was declined. The cart is open again and can be changed.",
  awaiting_customer_approval: "The customer must approve this payment in their banking app. Poll GET /orders/{id} for the result.",
  rejected_by_customer: "The customer rejected this payment. The cart is open again.",
  refunded: "The order was refunded.",
  pending_authorisation: "The payment is being authorised.",
};

export function orderJson(o: Order, merchantName: string | null, auth: Pick<Authorisation, "decision" | "reason"> | null, origin: string) {
  const cur = o.currency;
  const s = o.snapshot;
  return {
    id: o.id,
    kind: o.kind,
    status: o.status,
    next_step: NEXT_STEP[o.status]?.replace("{id}", o.id) ?? null,
    merchant: { id: o.merchantId, name: merchantName },
    cart_id: o.cartId,
    currency: cur,
    items: s.lines.map((l) => ({
      product_id: l.product_id,
      title: l.title,
      size: l.size,
      quantity: l.quantity,
      unit_price: toMoneyJson(l.unit_price_minor, cur),
      line_total: toMoneyJson(l.line_total_minor, cur),
      is_recurring: l.is_recurring,
    })),
    subtotal: toMoneyJson(s.subtotal_minor, cur),
    shipping: toMoneyJson(s.shipping_minor, cur),
    fees: s.fees.map((f) => ({ code: f.code, label: f.label, amount: toMoneyJson(f.amount_minor, cur) })),
    addons: s.addons.map((a) => ({ code: a.code, label: a.label, amount: toMoneyJson(a.amount_minor, cur) })),
    total: toMoneyJson(o.totalMinor, cur),
    is_recurring: o.isRecurring,
    card_token: maskToken(o.cardToken),
    cart_hash: o.cartHash,
    authorisation: auth ? { decision: auth.decision, reason: auth.reason } : null,
    created_at: o.createdAt.toISOString(),
    updated_at: o.updatedAt.toISOString(),
    api_url: `${origin}/api/v1/orders/${o.id}`,
  };
}
