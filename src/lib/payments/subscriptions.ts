// Subscription scenarios run from the admin panel. Both go through the normal payment pipeline.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attackScenarios, merchants, subscriptions } from "@/db/schema";
import { ApiError, notFound } from "@/lib/api/errors";
import { processPayment } from "./process";

/** The merchant charges the stored card token again for the next period. */
export async function simulateRenewal(subscriptionId: string) {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));
  if (!sub) throw notFound("Subscription", subscriptionId);
  if (sub.status !== "active") throw new ApiError(409, "subscription_inactive", "This subscription is not active.");
  const [m] = await db.select({ name: merchants.name }).from(merchants).where(eq(merchants.id, sub.merchantId));
  return processPayment({
    kind: "renewal",
    channel: "system",
    actor: { type: "merchant", id: sub.merchantId, name: m?.name ?? sub.merchantId },
    agentKeyId: null,
    cartId: null,
    merchantId: sub.merchantId,
    snapshot: {
      lines: [
        {
          product_id: sub.productId,
          title: `${sub.title} (renewal)`,
          category: "subscriptions",
          size: null,
          quantity: 1,
          unit_price_minor: sub.amountMinor,
          line_total_minor: sub.amountMinor,
          is_recurring: true,
        },
      ],
      subtotal_minor: sub.amountMinor,
      shipping_minor: 0,
      fees: [],
      addons: [],
      total_minor: sub.amountMinor,
    },
    currency: sub.currency,
    cardToken: sub.cardToken,
    cartHash: null,
    isRecurring: true,
    initiator: "merchant",
    subscriptionId: sub.id,
  });
}

/** Trap T11: a merchant that never sold this subscription tries to bill its stored token. */
export async function simulateRogueCharge(subscriptionId: string) {
  const [trap] = await db.select().from(attackScenarios).where(eq(attackScenarios.id, "T11"));
  if (!trap?.enabled) throw new ApiError(409, "trap_disabled", "Trap T11 is switched off. Turn it on in Admin › Traps first.");
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));
  if (!sub) throw notFound("Subscription", subscriptionId);
  const rogueId = trap.targetMerchantId!;
  const [rogue] = await db.select({ name: merchants.name }).from(merchants).where(eq(merchants.id, rogueId));
  const amount = Number(trap.payload.amount_minor ?? 4999);
  const label = String(trap.payload.label ?? "Membership renewal");
  return processPayment({
    kind: "merchant_initiated",
    channel: "system",
    actor: { type: "merchant", id: rogueId, name: rogue?.name ?? rogueId },
    agentKeyId: null,
    cartId: null,
    merchantId: rogueId,
    snapshot: {
      lines: [
        { product_id: "unknown", title: label, category: "unknown", size: null, quantity: 1, unit_price_minor: amount, line_total_minor: amount, is_recurring: true },
      ],
      subtotal_minor: amount,
      shipping_minor: 0,
      fees: [],
      addons: [],
      total_minor: amount,
    },
    currency: sub.currency,
    cardToken: sub.cardToken,
    cartHash: null,
    isRecurring: true,
    initiator: "merchant",
    subscriptionId: null,
  });
}
