import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opGetProduct } from "@/lib/agent-ops";

// GET /api/v1/products/{id}: full product including description and reviews.
export const GET = withAgent<RouteContext<"/api/v1/products/[id]">>(async (req, agent, ctx) =>
  json(await opGetProduct(opCtx(req, agent), (await ctx.params).id)),
);
