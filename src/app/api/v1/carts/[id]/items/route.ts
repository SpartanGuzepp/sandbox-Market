import { withAgent, opCtx, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opAddItem } from "@/lib/agent-ops";

// POST /api/v1/carts/{id}/items: add a product (same product + size increases the quantity).
export const POST = withAgent<RouteContext<"/api/v1/carts/[id]/items">>(async (req, agent, ctx) =>
  json(await opAddItem(opCtx(req, agent), (await ctx.params).id, (await readJson(req)) as never), 201),
);
