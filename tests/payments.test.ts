import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { looksLikeRealCardNumber, luhnValid, validateCardToken } from "@/lib/payments/card-token";
import { HttpAuthoriser, NoLeashAuthoriser, type AuthorisationRequest } from "@/lib/payments/authoriser";
import { cartHash, signCartHash } from "@/lib/cart/hash";
import { computeBreakdown } from "@/lib/cart/pricing";
import type { CartView } from "@/lib/cart/service";

describe("card tokens", () => {
  it("knows the Luhn check", () => {
    expect(luhnValid("4111111111111111")).toBe(true);
    expect(luhnValid("4111111111111112")).toBe(false);
  });
  it("rejects anything that looks like a real card number", () => {
    for (const pan of ["4111111111111111", "4111 1111 1111 1111", "5555-5555-5555-4444", "378282246310005", "vc_4111111111111111"]) {
      expect(looksLikeRealCardNumber(pan)).toBe(true);
      expect(() => validateCardToken(pan)).toThrowError(/real card number/);
    }
  });
  it("accepts virtual tokens and rejects malformed ones", () => {
    expect(validateCardToken(" vc_demo4f8a2c9e1b7d3a6f ")).toBe("vc_demo4f8a2c9e1b7d3a6f");
    expect(() => validateCardToken("vc_short")).toThrowError(/vc_ followed by/);
    expect(() => validateCardToken("tok_abcdefghijklmnopqrstuvwxyz")).toThrowError(/vc_ followed by/);
    expect(() => validateCardToken("")).toThrowError(/card token/);
  });
});

const view = (over: Partial<{ qty: number; fee: number }> = {}): CartView => ({
  cart: { id: "crt_1", merchantId: "mer_a" } as CartView["cart"],
  stage: "checkout",
  merchant: { id: "mer_a", name: "A" },
  breakdown: computeBreakdown(
    "EUR",
    [{ itemId: "itm_1", productId: "prd_1", title: "Shoe", size: "42", quantity: over.qty ?? 1, unitPriceMinor: 12900, shippingMinor: 490, isRecurring: false, billingInterval: null }],
    { fees: over.fee ? [{ code: "handling_fee", label: "Handling", amountMinor: over.fee }] : [] },
  ),
});

describe("cart hash and signature", () => {
  it("is stable for the same cart and changes when the cart changes", () => {
    expect(cartHash(view())).toBe(cartHash(view()));
    expect(cartHash(view())).not.toBe(cartHash(view({ qty: 2 })));
    expect(cartHash(view())).not.toBe(cartHash(view({ fee: 2500 })));
  });
  it("signs with the secret", () => {
    const h = cartHash(view());
    expect(signCartHash(h, "a")).toBe(signCartHash(h, "a"));
    expect(signCartHash(h, "a")).not.toBe(signCartHash(h, "b"));
  });
});

const REQ: AuthorisationRequest = {
  request_id: "authreq_test", timestamp: new Date().toISOString(), card_token: "vc_demo4f8a2c9e1b7d3a6f",
  amount_minor: 1000, amount: "10.00", currency: "EUR", merchant_id: "mer_a", merchant_name: "A", merchant_mcc: "5655",
  merchant_country: "CH", merchant_joined_at: new Date().toISOString(), is_recurring: false, initiator: "customer_agent",
  order_id: "ord_1", cart_id: "crt_1", cart_hash: "sha256:x",
};

describe("authorisers", () => {
  let server: Server;
  let base = "";
  let lastSignature: string | undefined;
  beforeAll(async () => {
    server = createServer((req, res) => {
      lastSignature = req.headers["x-sandbox-signature"] as string | undefined;
      req.resume();
      req.on("end", () => {
        if (req.url === "/stepup") return res.end(JSON.stringify({ decision: "step_up", reason: "big" }));
        if (req.url === "/nonsense") return res.end("hello");
        if (req.url === "/500") { res.statusCode = 500; return res.end("boom"); }
        if (req.url === "/slow") return; // never answers
        res.end(JSON.stringify({ decision: "approve", reason: "ok" }));
      });
    });
    await new Promise<void>((r) => server.listen(0, r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    server.closeAllConnections();
    server.close();
  });

  it("no leash approves everything", async () => {
    expect((await new NoLeashAuthoriser().authorise()).decision).toBe("approve");
  });
  it("uses the leash's answer and signs the request", async () => {
    const r = await new HttpAuthoriser(`${base}/stepup`, "secret").authorise(REQ);
    expect(r.decision).toBe("step_up");
    expect(r.reason).toBe("big");
    expect(lastSignature).toMatch(/^sha256=[0-9a-f]{64}$/);
  });
  it("fails closed on nonsense, errors, unreachable and timeouts", async () => {
    expect((await new HttpAuthoriser(`${base}/nonsense`, null).authorise(REQ)).reason).toMatch(/invalid_response/);
    expect((await new HttpAuthoriser(`${base}/500`, null).authorise(REQ)).reason).toMatch(/HTTP 500/);
    expect((await new HttpAuthoriser("http://127.0.0.1:1/nope", null).authorise(REQ)).decision).toBe("decline");
    const slow = await new HttpAuthoriser(`${base}/slow`, null).authorise(REQ);
    expect(slow.decision).toBe("decline");
    expect(slow.reason).toMatch(/timeout/);
  }, 10_000);
});
