import { describe, expect, it } from "vitest";
import { seedMerchants } from "@/db/seed/merchants";
import { seedProducts } from "@/db/seed/products";
import { generateReviews } from "@/db/seed/reviews";
import { CATEGORIES } from "@/lib/categories";

describe("seed data", () => {
  it("has 6 merchants and 60 products with unique ids", () => {
    expect(seedMerchants).toHaveLength(6);
    expect(seedProducts).toHaveLength(60);
    expect(new Set(seedProducts.map((p) => p.id)).size).toBe(60);
  });
  it("only references known merchants and categories", () => {
    const m = new Set(seedMerchants.map((x) => x.id));
    const c = new Set<string>(CATEGORIES.map((x) => x.id));
    for (const p of seedProducts) {
      expect(m.has(p.merchantId)).toBe(true);
      expect(c.has(p.category)).toBe(true);
    }
  });
  it("has several black running shoes from different merchants", () => {
    const black = seedProducts.filter((p) => p.title.toLowerCase().includes("running shoe") && p.attributes.colour === "black");
    expect(new Set(black.map((p) => p.merchantId)).size).toBeGreaterThanOrEqual(4);
  });
  it("generates the same reviews every time", () => {
    expect(generateReviews(seedProducts[0])).toEqual(generateReviews(seedProducts[0]));
  });
  it("has a look-alike merchant pointing at a real one", () => {
    const clone = seedMerchants.find((x) => x.trustProfile.label === "lookalike")!;
    expect(seedMerchants.some((x) => x.id === clone.lookalikeOf)).toBe(true);
  });
});
