// The customer's (simulated) banking app authenticates with the CUSTOMER_PIN, never with an agent key.
// This is what stops an agent from approving its own step-up requests.
import { timingSafeEqual, createHash } from "node:crypto";
import { requireEnv } from "@/lib/env";
import { ApiError } from "./errors";

export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function authenticateCustomer(req: Request) {
  if (req.headers.get("x-agent-key")) {
    throw new ApiError(403, "agents_cannot_approve", "Only the customer can approve or reject a payment. Agent keys are not accepted here.");
  }
  const pin = req.headers.get("x-customer-pin");
  if (!pin) throw new ApiError(401, "missing_customer_pin", "Send the customer's PIN in the X-Customer-Pin header.");
  if (!safeEqual(pin, requireEnv("CUSTOMER_PIN"))) throw new ApiError(401, "invalid_customer_pin", "Wrong PIN.");
}
