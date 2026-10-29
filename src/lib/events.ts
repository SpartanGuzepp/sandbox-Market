// Append-only activity log. Every meaningful action goes through logEvent().
// It feeds the admin activity log, the demo timeline and the outgoing webhooks.
import { after } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { deliverWebhooks, WEBHOOK_EVENT_TYPES } from "@/lib/webhooks";
import { config } from "@/lib/env";

export type Actor = {
  type: "agent" | "web" | "admin" | "customer" | "system" | "authoriser" | "merchant";
  id?: string | null;
  name?: string | null;
};

export async function logEvent(input: {
  actor: Actor;
  type: string;
  summary: string;
  cartId?: string | null;
  orderId?: string | null;
  data?: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(events)
    .values({
      actorType: input.actor.type,
      actorId: input.actor.id ?? null,
      actorName: input.actor.name ?? null,
      type: input.type,
      cartId: input.cartId ?? null,
      orderId: input.orderId ?? null,
      summary: input.summary,
      data: input.data ?? {},
    })
    .returning();

  if (WEBHOOK_EVENT_TYPES.has(row.type) && config.webhookUrls().length) {
    // Send webhooks after the response has gone out, so a slow receiver never slows the shopper down.
    const send = () => deliverWebhooks(row).catch((e) => console.error("webhook delivery failed", e));
    try {
      after(send);
    } catch {
      void send(); // outside a request (e.g. scripts)
    }
  }
  return row;
}
