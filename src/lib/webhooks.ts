// Outgoing webhooks. Selected events are POSTed to every URL in WEBHOOK_URLS,
// signed with WEBHOOK_SECRET, and every delivery attempt is logged.
import { createHmac } from "node:crypto";
import { db } from "@/db/client";
import { webhookDeliveries, type EventRow } from "@/db/schema";
import { config } from "@/lib/env";

export const WEBHOOK_EVENT_TYPES = new Set([
  "cart.created",
  "cart.item_added",
  "checkout.attempted",
  "charge.attempted",
  "authorisation.result",
  "order.placed",
  "order.declined",
  "order.awaiting_customer_approval",
  "order.customer_approved",
  "order.customer_rejected",
  "order.refunded",
]);

export function webhookPayload(e: EventRow) {
  return {
    id: `evt_${e.id}`,
    type: e.type,
    created_at: e.ts.toISOString(),
    actor: { type: e.actorType, id: e.actorId, name: e.actorName },
    cart_id: e.cartId,
    order_id: e.orderId,
    summary: e.summary,
    data: e.data,
  };
}

export async function deliverWebhooks(e: EventRow) {
  const urls = config.webhookUrls();
  if (!urls.length || !WEBHOOK_EVENT_TYPES.has(e.type)) return;
  const body = JSON.stringify(webhookPayload(e));
  const secret = config.webhookSecret();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "SandboxMarket-Webhooks/1.0",
    "X-Sandbox-Event": e.type,
    "X-Sandbox-Event-Id": `evt_${e.id}`,
  };
  if (secret) headers["X-Sandbox-Signature"] = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  await Promise.all(
    urls.map(async (url) => {
      const started = Date.now();
      let statusCode: number | null = null;
      let error: string | null = null;
      try {
        const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
        statusCode = res.status;
        if (!res.ok) error = (await res.text()).slice(0, 300);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
      await db.insert(webhookDeliveries).values({
        eventId: e.id,
        eventType: e.type,
        url,
        statusCode,
        error,
        latencyMs: Date.now() - started,
      });
    }),
  );
}
