import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opGetOrder } from "@/lib/agent-ops";

// GET /api/v1/orders/{id}
export const GET = withAgent<RouteContext<"/api/v1/orders/[id]">>(async (req, agent, ctx) =>
  json(await opGetOrder(opCtx(req, agent), (await ctx.params).id)),
);
