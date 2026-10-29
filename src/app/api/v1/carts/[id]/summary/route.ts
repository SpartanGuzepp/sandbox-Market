import { withAgent, originOf } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { getCartView, loadCart } from "@/lib/cart/service";
import { cartHash, signCartHash } from "@/lib/cart/hash";
import { cartSummaryJson } from "@/lib/api/serialisers";
import { config } from "@/lib/env";

// GET /api/v1/carts/{id}/summary: exactly what checkout will charge, with cart_hash and an HMAC signature.
export const GET = withAgent<RouteContext<"/api/v1/carts/[id]/summary">>(async (req, agent, ctx) => {
  const { id } = await ctx.params;
  const cart = await loadCart(id, { agentKeyId: agent.id });
  const view = await getCartView(cart, "checkout");
  const hash = cartHash(view);
  return json(cartSummaryJson(view, hash, signCartHash(hash, config.cartSigningSecret()), originOf(req)));
});
