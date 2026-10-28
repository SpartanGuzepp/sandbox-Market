import { withAgent, originOf } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { listMerchants } from "@/lib/catalogue";
import { merchantJson } from "@/lib/api/serialisers";

// GET /api/v1/merchants
export const GET = withAgent(async (req) => {
  const origin = originOf(req);
  const items = await listMerchants();
  return json({ items: items.map((m) => merchantJson(m, origin)) });
});
