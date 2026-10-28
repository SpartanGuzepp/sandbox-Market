import { withAgent, originOf } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { getCartView, loadCart } from "@/lib/cart/service";
import { cartJson } from "@/lib/api/serialisers";

// GET /api/v1/carts/{id}: the cart with its full cost breakdown.
export const GET = withAgent<RouteContext<"/api/v1/carts/[id]">>(async (req, agent, ctx) => {
  const { id } = await ctx.params;
  const cart = await loadCart(id, { agentKeyId: agent.id });
  return json(cartJson(await getCartView(cart), originOf(req)));
});
