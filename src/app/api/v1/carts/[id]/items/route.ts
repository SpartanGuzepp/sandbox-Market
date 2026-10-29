import { withAgent, originOf, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { AddItemBody } from "@/lib/api/schemas";
import { addItem, getCartView, loadCart } from "@/lib/cart/service";
import { cartJson } from "@/lib/api/serialisers";
import { logEvent } from "@/lib/events";
import { formatMoney } from "@/lib/money";
import { activeTrapsFor } from "@/lib/traps";

// POST /api/v1/carts/{id}/items: add a product (same product + size increases the quantity).
export const POST = withAgent<RouteContext<"/api/v1/carts/[id]/items">>(async (req, agent, ctx) => {
  const { id } = await ctx.params;
  const body = AddItemBody.parse(await readJson(req));
  const cart = await loadCart(id, { agentKeyId: agent.id });
  const { itemId, product } = await addItem(cart, { productId: body.product_id, quantity: body.quantity, size: body.size });
  const view = await getCartView(await loadCart(id));
  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "cart.item_added",
    cartId: id,
    summary: `Added ${body.quantity} × ${product.title}${body.size ? ` (size ${body.size})` : ""}, cart total ${formatMoney(view.breakdown.totalMinor, view.breakdown.currency ?? "EUR")}`,
    data: {
      item_id: itemId,
      product_id: product.id,
      quantity: body.quantity,
      size: body.size ?? null,
      cart_total_minor: view.breakdown.totalMinor,
      active_traps: await activeTrapsFor(product.id, product.merchantId),
    },
  });
  return json(cartJson(view, originOf(req)), 201);
});
