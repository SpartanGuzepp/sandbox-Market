import { withAgent, originOf } from "@/lib/api/handler";
import { json, ApiError } from "@/lib/api/errors";
import { SearchQuery } from "@/lib/api/schemas";
import { searchProducts } from "@/lib/catalogue";
import { productSummaryJson } from "@/lib/api/serialisers";
import { parseMajor } from "@/lib/money";
import { logEvent } from "@/lib/events";

// GET /api/v1/products?q=&category=&max_price=&colour=&size=&merchant_id=&sort=&limit=&offset=
export const GET = withAgent(async (req, agent) => {
  const params = SearchQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  const maxPriceMinor = params.max_price !== undefined ? parseMajor(params.max_price) : undefined;
  if (maxPriceMinor === null) throw new ApiError(400, "invalid_request", "max_price must be a number in euros.");

  const { total, items } = await searchProducts({
    q: params.q,
    category: params.category,
    maxPriceMinor,
    colour: params.colour,
    size: params.size,
    merchantId: params.merchant_id,
    sort: params.sort,
    limit: params.limit,
    offset: params.offset,
  });

  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "product.searched",
    summary: `Searched products${params.q ? ` for "${params.q}"` : ""} (${total} results)`,
    data: { query: params, total },
  });

  const origin = originOf(req);
  return json({ total, limit: params.limit, offset: params.offset, items: items.map((p) => productSummaryJson(p, origin)) });
});
