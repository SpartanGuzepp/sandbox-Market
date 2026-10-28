import { withAgent, originOf, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { UpdateItemBody } from "@/lib/api/schemas";
import { getCartView, loadCart, removeItem, updateItemQuantity } from "@/lib/cart/service";
import { cartJson } from "@/lib/api/serialisers";
import { logEvent } from "@/lib/events";

type Ctx = RouteContext<"/api/v1/carts/[id]/items/[itemId]">;

// PATCH /api/v1/carts/{id}/items/{itemId}: change the quantity.
export const PATCH = withAgent<Ctx>(async (req, agent, ctx) => {
  const { id, itemId } = await ctx.params;
  const body = UpdateItemBody.parse(await readJson(req));
  const cart = await loadCart(id, { agentKeyId: agent.id });
  await updateItemQuantity(cart, itemId, body.quantity);
  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "cart.item_updated",
    cartId: id,
    summary: `Changed quantity of ${itemId} to ${body.quantity}`,
    data: { item_id: itemId, quantity: body.quantity },
  });
  return json(cartJson(await getCartView(await loadCart(id)), originOf(req)));
});

// DELETE /api/v1/carts/{id}/items/{itemId}: remove a line from the cart.
export const DELETE = withAgent<Ctx>(async (req, agent, ctx) => {
  const { id, itemId } = await ctx.params;
  const cart = await loadCart(id, { agentKeyId: agent.id });
  const removed = await removeItem(cart, itemId);
  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "cart.item_removed",
    cartId: id,
    summary: `Removed ${removed.productId} from cart`,
    data: { item_id: itemId, product_id: removed.productId },
  });
  return json(cartJson(await getCartView(await loadCart(id)), originOf(req)));
});
