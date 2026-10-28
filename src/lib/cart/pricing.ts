// Pure price calculation: no database, so it is easy to test.
// Phase 3 will add fees and add-ons (where some traps live) through `extras`.

export type PricingLine = {
  itemId: string;
  productId: string;
  title: string;
  size: string | null;
  quantity: number;
  unitPriceMinor: number;
  shippingMinor: number;
  isRecurring: boolean;
  billingInterval: string | null;
};

export type PricingExtra = { code: string; label: string; amountMinor: number };

export type Breakdown = {
  currency: string | null;
  lines: (PricingLine & { lineTotalMinor: number })[];
  subtotalMinor: number;
  shippingMinor: number;
  fees: PricingExtra[];
  addons: PricingExtra[];
  totalMinor: number;
  recurring: { productId: string; title: string; amountMinor: number; interval: string }[];
};

export function computeBreakdown(
  currency: string | null,
  lines: PricingLine[],
  extras: { fees?: PricingExtra[]; addons?: PricingExtra[] } = {},
): Breakdown {
  const priced = lines.map((l) => ({ ...l, lineTotalMinor: l.unitPriceMinor * l.quantity }));
  const subtotalMinor = priced.reduce((s, l) => s + l.lineTotalMinor, 0);
  // Shipping rule: one parcel per order, so the highest shipping cost of any item applies.
  const shippingMinor = priced.reduce((m, l) => Math.max(m, l.shippingMinor), 0);
  const fees = extras.fees ?? [];
  const addons = extras.addons ?? [];
  const totalMinor =
    subtotalMinor +
    shippingMinor +
    fees.reduce((s, f) => s + f.amountMinor, 0) +
    addons.reduce((s, a) => s + a.amountMinor, 0);
  const recurring = priced
    .filter((l) => l.isRecurring)
    .map((l) => ({
      productId: l.productId,
      title: l.title,
      amountMinor: l.lineTotalMinor,
      interval: l.billingInterval ?? "month",
    }));
  return { currency, lines: priced, subtotalMinor, shippingMinor, fees, addons, totalMinor, recurring };
}
