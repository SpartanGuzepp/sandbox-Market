import { withAgent, originOf } from "@/lib/api/handler";
import { json, notFound } from "@/lib/api/errors";
import { getProduct } from "@/lib/catalogue";
import { productDetailJson } from "@/lib/api/serialisers";
import { logEvent } from "@/lib/events";

// GET /api/v1/products/{id}: full product including description and reviews.
export const GET = withAgent<RouteContext<"/api/v1/products/[id]">>(async (req, agent, ctx) => {
  const { id } = await ctx.params;
  const product = await getProduct(id);
  if (!product) throw notFound("Product", id);
  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "product.viewed",
    summary: `Viewed ${product.title} (${product.merchant.name})`,
    data: { product_id: id, merchant_id: product.merchantId },
  });
  return json(productDetailJson(product, originOf(req)));
});
