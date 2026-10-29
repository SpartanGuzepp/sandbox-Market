import { withAgent, originOf, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { CheckoutBody } from "@/lib/api/schemas";
import { loadCart } from "@/lib/cart/service";
import { checkoutCart } from "@/lib/payments/checkout";
import { getOrderWithAuth } from "@/lib/orders";
import { orderJson } from "@/lib/api/serialisers";

// POST /api/v1/carts/{id}/checkout  {card_token, expected_cart_hash?}
// 201 placed | 202 awaiting customer approval | 402 declined. The body is always the order.
export const POST = withAgent<RouteContext<"/api/v1/carts/[id]/checkout">>(async (req, agent, ctx) => {
  const { id } = await ctx.params;
  const body = CheckoutBody.parse(await readJson(req));
  const cart = await loadCart(id, { agentKeyId: agent.id });
  const { order } = await checkoutCart(cart, {
    cardToken: body.card_token,
    expectedCartHash: body.expected_cart_hash,
    actor: { type: "agent", id: agent.id, name: agent.name },
    channel: "api",
    agentKeyId: agent.id,
  });
  const full = (await getOrderWithAuth(order.id))!;
  const status = order.status === "placed" ? 201 : order.status === "awaiting_customer_approval" ? 202 : 402;
  return json(orderJson(full.order, full.merchantName, full.auth, originOf(req)), status);
});
