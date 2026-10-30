import { withAgent, opCtx, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opCheckout } from "@/lib/agent-ops";

// POST /api/v1/carts/{id}/checkout  {card_token, expected_cart_hash?}
// 201 placed | 202 awaiting customer approval | 402 declined. The body is always the order.
export const POST = withAgent<RouteContext<"/api/v1/carts/[id]/checkout">>(async (req, agent, ctx) => {
  const { status, order } = await opCheckout(opCtx(req, agent), (await ctx.params).id, (await readJson(req)) as never);
  return json(order, status);
});
