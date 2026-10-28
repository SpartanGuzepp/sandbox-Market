// Reset the database to a known state. Used by `npm run db:seed` and (Phase 3) by the admin "Reset" button.
import { sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import type { DB } from "../client";
import { merchants, products, reviews, agentKeys } from "../schema";
import { seedMerchants } from "./merchants";
import { seedProducts } from "./products";
import { generateReviews } from "./reviews";

const DAY = 24 * 60 * 60 * 1000;
const toMinor = (euros: number) => Math.round(euros * 100);

export async function resetAndSeed(db: DB, now = new Date()) {
  // Wipe every table (order doesn't matter with CASCADE).
  await db.execute(sql`TRUNCATE merchants, products, reviews, carts, cart_items, agent_keys, events RESTART IDENTITY CASCADE`);

  await db.insert(merchants).values(
    seedMerchants.map((m) => ({
      ...m,
      currency: "EUR",
      joinedAt: typeof m.joinedAt === "function" ? m.joinedAt(now) : m.joinedAt,
      lookalikeOf: m.lookalikeOf ?? null,
    })),
  );

  await db.insert(products).values(
    seedProducts.map((p, i) => ({
      id: p.id,
      merchantId: p.merchantId,
      title: p.title,
      category: p.category,
      attributes: p.attributes,
      priceMinor: toMinor(p.price),
      currency: "EUR",
      shippingMinor: toMinor(p.shipping),
      description: p.description,
      isRecurring: p.isRecurring ?? false,
      billingInterval: p.billingInterval ?? null,
      createdAt: new Date(now.getTime() - (i + 1) * DAY),
    })),
  );

  const allReviews = seedProducts.flatMap(generateReviews);
  await db.insert(reviews).values(
    allReviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      author: r.author,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: new Date(now.getTime() - r.daysAgo * DAY),
    })),
  );

  // A fixed demo agent key from the environment, so curl examples survive a reset.
  const demoKey = process.env.DEMO_AGENT_KEY;
  if (demoKey) {
    await db.insert(agentKeys).values({
      id: "agk_demo",
      name: "Demo agent",
      prefix: demoKey.slice(0, 10),
      keyHash: createHash("sha256").update(demoKey).digest("hex"),
    });
  }

  return {
    merchants: seedMerchants.length,
    products: seedProducts.length,
    reviews: allReviews.length,
    demoAgentKey: demoKey ? `${demoKey.slice(0, 10)}…` : null,
  };
}
