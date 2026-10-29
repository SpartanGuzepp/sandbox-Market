import { customerDecisionRoute } from "@/lib/api/customer-decision-route";

// POST /api/v1/orders/{id}/reject: the customer rejects a step-up payment (X-Customer-Pin header).
export const POST = customerDecisionRoute(false);
