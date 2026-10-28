import { withAgent, originOf, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { CreateCartBody } from "@/lib/api/schemas";
import { createCart, getCartView } from "@/lib/cart/service";
import { cartJson } from "@/lib/api/serialisers";
import { logEvent } from "@/lib/events";

// POST /api/v1/carts: create an empty cart owned by the calling agent.
export const POST = withAgent(async (req, agent) => {
  CreateCartBody.parse(await readJson(req));
  const cart = await createCart({ channel: "api", agentKeyId: agent.id });
  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "cart.created",
    cartId: cart.id,
    summary: `Created cart ${cart.id}`,
  });
  return json(cartJson(await getCartView(cart), originOf(req)), 201);
});
