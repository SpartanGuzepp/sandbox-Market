import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opRemoveAddon } from "@/lib/agent-ops";

// POST /api/v1/carts/{id}/addons/{code}/remove: remove an optional add-on.
export const POST = withAgent<RouteContext<"/api/v1/carts/[id]/addons/[code]/remove">>(async (req, agent, ctx) => {
  const { id, code } = await ctx.params;
  return json(await opRemoveAddon(opCtx(req, agent), id, code));
});
