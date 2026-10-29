// Shared handler for POST /api/v1/orders/{id}/approve and /reject.
// Only the CUSTOMER can call these (X-Customer-Pin), never an agent.
import { originOf } from "./handler";
import { errorResponse, json } from "./errors";
import { authenticateCustomer } from "./customer";
import { customerDecision } from "@/lib/payments/process";
import { getOrderWithAuth } from "@/lib/orders";
import { orderJson } from "./serialisers";

export function customerDecisionRoute(approve: boolean) {
  return async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    try {
      authenticateCustomer(req);
      const { id } = await ctx.params;
      await customerDecision(id, approve);
      const full = (await getOrderWithAuth(id))!;
      return json(orderJson(full.order, full.merchantName, full.auth, originOf(req)));
    } catch (e) {
      return errorResponse(e);
    }
  };
}
