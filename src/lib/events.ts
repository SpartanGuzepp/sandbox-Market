// Append-only activity log. Every meaningful action goes through logEvent().
// Phase 3 adds webhook delivery and the demo timeline on top of this table.
import { db } from "@/db/client";
import { events } from "@/db/schema";

export type Actor = {
  type: "agent" | "web" | "admin" | "customer" | "system" | "authoriser";
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
  return row;
}
