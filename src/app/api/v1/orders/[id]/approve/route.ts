import { customerDecisionRoute } from "@/lib/api/customer-decision-route";

// POST /api/v1/orders/{id}/approve: the customer approves a step-up payment (X-Customer-Pin header).
export const POST = customerDecisionRoute(true);
