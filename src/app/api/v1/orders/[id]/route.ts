import { withAgent, originOf } from "@/lib/api/handler";
import { json, notFound } from "@/lib/api/errors";
import { getOrderWithAuth } from "@/lib/orders";
import { orderJson } from "@/lib/api/serialisers";

// GET /api/v1/orders/{id}
export const GET = withAgent<RouteContext<"/api/v1/orders/[id]">>(async (req, agent, ctx) => {
  const { id } = await ctx.params;
  const full = await getOrderWithAuth(id);
  if (!full || full.order.agentKeyId !== agent.id) throw notFound("Order", id);
  return json(orderJson(full.order, full.merchantName, full.auth, originOf(req)));
});
