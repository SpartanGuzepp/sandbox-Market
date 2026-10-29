// The payment hook. Checkout never decides by itself whether a payment succeeds:
// it asks a PaymentAuthoriser. Which one is used depends on PAYMENT_AUTHORISER_URL:
//   empty -> NoLeashAuthoriser (approves everything: an agent with no leash)
//   set   -> HttpAuthoriser (POSTs the request to the leash and uses its answer)
import { createHmac } from "node:crypto";
import { z } from "zod";
import { config } from "@/lib/env";

export type AuthorisationRequest = {
  request_id: string;
  timestamp: string;
  card_token: string;
  amount_minor: number;
  amount: string;
  currency: string;
  merchant_id: string;
  merchant_name: string;
  merchant_mcc: string;
  merchant_country: string | null;
  merchant_joined_at: string;
  is_recurring: boolean;
  initiator: "customer_agent" | "customer_web" | "merchant";
  order_id: string;
  cart_id: string | null;
  cart_hash: string | null;
  // Only present when SEND_BASKET_DETAILS=true. A real card authorisation never carries these.
  line_items?: {
    product_id: string;
    title: string;
    category: string;
    size: string | null;
    quantity: number;
    unit_price_minor: number;
    line_total_minor: number;
    is_recurring: boolean;
  }[];
  fees?: { code: string; label: string; amount_minor: number }[];
  addons?: { code: string; label: string; amount_minor: number }[];
  shipping_minor?: number;
};

export type Decision = "approve" | "decline" | "step_up";

export type AuthorisationResult = {
  decision: Decision;
  reason: string;
  authoriser: "no_leash" | "http";
  response: Record<string, unknown> | null;
  httpStatus: number | null;
  error: string | null;
  latencyMs: number;
};

export interface PaymentAuthoriser {
  readonly name: "no_leash" | "http";
  authorise(req: AuthorisationRequest): Promise<AuthorisationResult>;
}

/** Built-in default: approves everything. The starting state, an agent with no leash. */
export class NoLeashAuthoriser implements PaymentAuthoriser {
  readonly name = "no_leash" as const;
  async authorise(): Promise<AuthorisationResult> {
    const response = { decision: "approve", reason: "No leash configured: every payment is approved." };
    return { decision: "approve", reason: response.reason, authoriser: this.name, response, httpStatus: null, error: null, latencyMs: 0 };
  }
}

const ResponseSchema = z.object({
  decision: z.enum(["approve", "decline", "step_up"]),
  reason: z.string().max(2000).default(""),
});

export const AUTHORISER_TIMEOUT_MS = 5000;

/**
 * Calls the external leash. Fails CLOSED: if the leash is unreachable, slow or answers
 * nonsense, the payment is declined, just like a real bank would do.
 */
export class HttpAuthoriser implements PaymentAuthoriser {
  readonly name = "http" as const;
  constructor(
    private url: string,
    private secret: string | null,
  ) {}

  async authorise(req: AuthorisationRequest): Promise<AuthorisationResult> {
    const body = JSON.stringify(req);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SandboxMarket-Authoriser/1.0",
      "X-Sandbox-Request-Id": req.request_id,
    };
    // Signature so the leash can check the request really comes from Sandbox Market.
    if (this.secret) headers["X-Sandbox-Signature"] = "sha256=" + createHmac("sha256", this.secret).update(body).digest("hex");

    const started = Date.now();
    const fail = (reason: string, error: string, httpStatus: number | null = null, response: Record<string, unknown> | null = null): AuthorisationResult => ({
      decision: "decline",
      reason,
      authoriser: this.name,
      response,
      httpStatus,
      error,
      latencyMs: Date.now() - started,
    });

    let res: Response;
    try {
      res = await fetch(this.url, { method: "POST", headers, body, signal: AbortSignal.timeout(AUTHORISER_TIMEOUT_MS) });
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      return fail(
        timedOut ? `authoriser_timeout: no answer within ${AUTHORISER_TIMEOUT_MS / 1000}s, declined for safety` : "authoriser_unavailable: could not reach the authoriser, declined for safety",
        e instanceof Error ? e.message : String(e),
      );
    }
    const text = await res.text();
    let parsedJson: Record<string, unknown> | null = null;
    try {
      parsedJson = JSON.parse(text);
    } catch {}
    if (!res.ok) {
      return fail(`authoriser_error: HTTP ${res.status}, declined for safety`, text.slice(0, 500), res.status, parsedJson);
    }
    const parsed = ResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return fail("authoriser_invalid_response: expected {decision, reason}, declined for safety", text.slice(0, 500), res.status, parsedJson);
    }
    return {
      decision: parsed.data.decision,
      reason: parsed.data.reason || "(no reason given)",
      authoriser: this.name,
      response: parsedJson,
      httpStatus: res.status,
      error: null,
      latencyMs: Date.now() - started,
    };
  }
}

export function getAuthoriser(): PaymentAuthoriser {
  const url = config.authoriserUrl();
  return url ? new HttpAuthoriser(url, config.authoriserSecret()) : new NoLeashAuthoriser();
}
