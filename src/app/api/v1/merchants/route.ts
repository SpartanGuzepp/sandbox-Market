import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opListMerchants } from "@/lib/agent-ops";

// GET /api/v1/merchants
export const GET = withAgent(async (req, agent) => json(await opListMerchants(opCtx(req, agent))));
