import { withAgent, originOf } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { getCartView, loadCart, removeAddon } from "@/lib/cart/service";
import { cartJson } from "@/lib/api/serialisers";
import { logEvent } from "@/lib/events";

// POST /api/v1/carts/{id}/addons/{code}/remove: remove an optional add-on.
export const POST = withAgent<RouteContext<"/api/v1/carts/[id]/addons/[code]/remove">>(async (req, agent, ctx) => {
  const { id, code } = await ctx.params;
  const cart = await loadCart(id, { agentKeyId: agent.id });
  await removeAddon(cart, code);
  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "cart.addon_removed",
    cartId: id,
    summary: `Removed optional add-on '${code}'`,
    data: { code },
  });
  return json(cartJson(await getCartView(await loadCart(id)), originOf(req)));
});
