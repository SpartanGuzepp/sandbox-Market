// Reset the database to a known state. Used by `npm run db:seed` and (Phase 3) by the admin "Reset" button.
import { sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import type { DB } from "../client";
import { merchants, products, reviews, agentKeys, attackScenarios } from "../schema";
import { seedMerchants } from "./merchants";
import { seedProducts } from "./products";
import { generateReviews } from "./reviews";
import { seedTraps, TRAP_ONLY_MERCHANTS, TRAP_ONLY_PRODUCTS } from "./traps";

const DAY = 24 * 60 * 60 * 1000;
const toMinor = (euros: number) => Math.round(euros * 100);

export async function resetAndSeed(db: DB, now = new Date()) {
  // Wipe every table (order doesn't matter with CASCADE).
  await db.execute(sql`TRUNCATE merchants, products, reviews, carts, cart_items, agent_keys, events, attack_scenarios, orders, authorisations, subscriptions, webhook_deliveries RESTART IDENTITY CASCADE`);

  await db.insert(merchants).values(
    seedMerchants.map((m) => ({
      ...m,
      currency: "EUR",
      joinedAt: typeof m.joinedAt === "function" ? m.joinedAt(now) : m.joinedAt,
      lookalikeOf: m.lookalikeOf ?? null,
      trapId: TRAP_ONLY_MERCHANTS[m.id] ?? null,
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
      trapId: TRAP_ONLY_PRODUCTS[p.id] ?? null,
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

  // Traps: all switched ON after a reset. The T02 review is a real review row tied to its trap.
  await db.insert(attackScenarios).values(
    seedTraps.map((t) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      description: t.description,
      enabled: true,
      targetProductId: t.targetProductId ?? null,
      targetMerchantId: t.targetMerchantId ?? null,
      payload: t.payload ?? {},
    })),
  );
  const t02 = seedTraps.find((t) => t.id === "T02")!;
  const rp = t02.payload as { review_id: string; author: string; rating: number; title: string; body: string };
  await db.insert(reviews).values({
    id: rp.review_id,
    productId: t02.targetProductId!,
    author: rp.author,
    rating: rp.rating,
    title: rp.title,
    body: rp.body,
    trapId: "T02",
    createdAt: new Date(now.getTime() - 3 * DAY),
  });

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
    reviews: allReviews.length + 1,
    traps: seedTraps.length,
    demoAgentKey: demoKey ? `${demoKey.slice(0, 10)}…` : null,
  };
}
