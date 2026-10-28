// Turn database rows into public JSON. Only fields listed here are ever sent out.
// In particular, merchants.trust_profile and lookalike_of are never included.
import type { Merchant, Review } from "@/db/schema";
import type { ProductWithMerchant } from "@/lib/catalogue";
import type { CartView } from "@/lib/cart/service";
import { toMoneyJson } from "@/lib/money";

export function productSummaryJson(p: ProductWithMerchant, origin: string) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    price: toMoneyJson(p.priceMinor, p.currency),
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
    description: p.description,
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
    addons: b.addons.map((a) => ({ code: a.code, label: a.label, amount: toMoneyJson(a.amountMinor, cur) })),
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
