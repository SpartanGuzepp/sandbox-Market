import { withAgent, opCtx } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opListOrders } from "@/lib/agent-ops";

// GET /api/v1/orders: the calling agent's orders, newest first.
export const GET = withAgent(async (req, agent) => json(await opListOrders(opCtx(req, agent))));
