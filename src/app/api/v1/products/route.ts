import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opSearchProducts } from "@/lib/agent-ops";

// GET /api/v1/products?q=&category=&max_price=&colour=&size=&merchant_id=&sort=&limit=&offset=
export const GET = withAgent(async (req, agent) =>
  json(await opSearchProducts(opCtx(req, agent), Object.fromEntries(new URL(req.url).searchParams))),
);
