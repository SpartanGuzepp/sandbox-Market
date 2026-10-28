import { withAgent, originOf } from "@/lib/api/handler";
import { json, notFound } from "@/lib/api/errors";
import { getMerchant } from "@/lib/catalogue";
import { merchantJson } from "@/lib/api/serialisers";
import { logEvent } from "@/lib/events";

// GET /api/v1/merchants/{id}
export const GET = withAgent<RouteContext<"/api/v1/merchants/[id]">>(async (req, agent, ctx) => {
  const { id } = await ctx.params;
  const m = await getMerchant(id);
  if (!m) throw notFound("Merchant", id);
  await logEvent({
    actor: { type: "agent", id: agent.id, name: agent.name },
    type: "merchant.viewed",
    summary: `Viewed merchant ${m.name}`,
    data: { merchant_id: id },
  });
  return json(merchantJson(m, originOf(req)));
});
