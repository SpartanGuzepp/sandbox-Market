import { describe, expect, it } from "vitest";
import { computeBreakdown, type PricingLine } from "@/lib/cart/pricing";
import { formatMoney, parseMajor, toMoneyJson } from "@/lib/money";

const line = (over: Partial<PricingLine> = {}): PricingLine => ({
  itemId: "itm_1", productId: "prd_1", title: "Shoe", size: "42", quantity: 1,
  unitPriceMinor: 12900, shippingMinor: 490, isRecurring: false, billingInterval: null, ...over,
});

describe("computeBreakdown", () => {
  it("multiplies quantity and adds shipping once", () => {
    const b = computeBreakdown("EUR", [line({ quantity: 2 })]);
    expect(b.subtotalMinor).toBe(25800);
    expect(b.shippingMinor).toBe(490);
    expect(b.totalMinor).toBe(26290);
  });

  it("uses the highest shipping cost in the cart (one parcel)", () => {
    const b = computeBreakdown("EUR", [line({ shippingMinor: 0 }), line({ itemId: "itm_2", unitPriceMinor: 1990, shippingMinor: 490 })]);
    expect(b.shippingMinor).toBe(490);
    expect(b.totalMinor).toBe(12900 + 1990 + 490);
  });

  it("adds fees and add-ons to the total", () => {
    const b = computeBreakdown("EUR", [line()], {
      fees: [{ code: "handling", label: "Handling", amountMinor: 2500 }],
      addons: [{ code: "insurance", label: "Insurance", amountMinor: 990 }],
    });
    expect(b.totalMinor).toBe(12900 + 490 + 2500 + 990);
  });

  it("lists recurring lines", () => {
    const b = computeBreakdown("EUR", [line({ isRecurring: true, billingInterval: "month", quantity: 2, unitPriceMinor: 990 })]);
    expect(b.recurring).toEqual([{ productId: "prd_1", title: "Shoe", amountMinor: 1980, interval: "month" }]);
  });

  it("returns zero for an empty cart", () => {
    expect(computeBreakdown(null, []).totalMinor).toBe(0);
  });
});

describe("money helpers", () => {
  it("formats and serialises", () => {
    expect(formatMoney(12900, "EUR")).toBe("€129.00");
    expect(formatMoney(123456, "EUR")).toBe("€1,234.56");
    expect(toMoneyJson(1990, "EUR")).toEqual({ amount: "19.90", amount_minor: 1990, currency: "EUR" });
  });
  it("parses euro amounts", () => {
    expect(parseMajor("120")).toBe(12000);
    expect(parseMajor("120.5")).toBe(12050);
    expect(parseMajor("0.07")).toBe(7);
    expect(parseMajor("abc")).toBeNull();
    expect(parseMajor("1.234")).toBeNull();
  });
});
