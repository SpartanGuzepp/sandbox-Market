import { desc, eq } from "drizzle-orm";
import { withAgent, originOf } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { db } from "@/db/client";
import { merchants, orders } from "@/db/schema";
import { orderJson } from "@/lib/api/serialisers";

// GET /api/v1/orders: the calling agent's orders, newest first.
export const GET = withAgent(async (req, agent) => {
  const rows = await db
    .select({ order: orders, merchantName: merchants.name })
    .from(orders)
    .leftJoin(merchants, eq(orders.merchantId, merchants.id))
    .where(eq(orders.agentKeyId, agent.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);
  const origin = originOf(req);
  return json({
    items: rows.map((r) =>
      orderJson(r.order, r.merchantName, r.order.decision ? { decision: r.order.decision, reason: r.order.decisionReason ?? "" } : null, origin),
    ),
  });
});
