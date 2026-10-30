import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opGetSummary } from "@/lib/agent-ops";

// GET /api/v1/carts/{id}/summary: exactly what checkout will charge, with cart_hash and an HMAC signature.
export const GET = withAgent<RouteContext<"/api/v1/carts/[id]/summary">>(async (req, agent, ctx) =>
  json(await opGetSummary(opCtx(req, agent), (await ctx.params).id)),
);
