import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opGetCart } from "@/lib/agent-ops";

// GET /api/v1/carts/{id}: the cart with its full cost breakdown.
export const GET = withAgent<RouteContext<"/api/v1/carts/[id]">>(async (req, agent, ctx) =>
  json(await opGetCart(opCtx(req, agent), (await ctx.params).id)),
);
