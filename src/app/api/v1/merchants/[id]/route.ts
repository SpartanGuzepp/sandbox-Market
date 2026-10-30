import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opGetMerchant } from "@/lib/agent-ops";

// GET /api/v1/merchants/{id}
export const GET = withAgent<RouteContext<"/api/v1/merchants/[id]">>(async (req, agent, ctx) =>
  json(await opGetMerchant(opCtx(req, agent), (await ctx.params).id)),
);
