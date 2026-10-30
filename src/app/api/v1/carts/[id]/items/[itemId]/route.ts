import { withAgent, opCtx, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opRemoveItem, opUpdateItem } from "@/lib/agent-ops";

type Ctx = RouteContext<"/api/v1/carts/[id]/items/[itemId]">;

// PATCH /api/v1/carts/{id}/items/{itemId}: change the quantity.
export const PATCH = withAgent<Ctx>(async (req, agent, ctx) => {
  const { id, itemId } = await ctx.params;
  return json(await opUpdateItem(opCtx(req, agent), id, itemId, (await readJson(req)) as never));
});

// DELETE /api/v1/carts/{id}/items/{itemId}: remove a line from the cart.
export const DELETE = withAgent<Ctx>(async (req, agent, ctx) => {
  const { id, itemId } = await ctx.params;
  return json(await opRemoveItem(opCtx(req, agent), id, itemId));
});
