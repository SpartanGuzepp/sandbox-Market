// A tiny stand-in for the real leash, for local testing and demos. NOT part of the shop.
//
//   npm run mock-leash                 -> rules mode (see decide() below)
//   npm run mock-leash -- approve      -> approves everything
//   npm run mock-leash -- decline      -> declines everything
//   npm run mock-leash -- step_up      -> asks the customer every time
//   npm run mock-leash -- slow         -> never answers in time (tests the 5 s timeout)
//
// Then set PAYMENT_AUTHORISER_URL=http://localhost:4000/authorise in .env and restart `npm run dev`.
// Webhooks: set WEBHOOK_URLS=http://localhost:4000/webhooks to see them printed here.
import "dotenv/config";
import { createServer } from "node:http";
import { createHmac } from "node:crypto";

const PORT = Number(process.env.MOCK_LEASH_PORT ?? 4000);
const MODE = process.argv[2] ?? "rules";
const AUTH_SECRET = process.env.PAYMENT_AUTHORISER_SECRET || null;
const HOOK_SECRET = process.env.WEBHOOK_SECRET || null;

type Req = {
  amount_minor: number;
  currency: string;
  merchant_name: string;
  merchant_mcc: string;
  merchant_country: string | null;
  merchant_joined_at: string;
  is_recurring: boolean;
  initiator: string;
  line_items?: { title: string; quantity: number; category: string }[];
};

// Example rules. Your real leash will be much smarter.
const SHOE_OR_SPORT_MCCS = ["5655", "5661", "5941"];
function decide(r: Req): { decision: string; reason: string } {
  const ageDays = (Date.now() - new Date(r.merchant_joined_at).getTime()) / 86_400_000;
  if (r.currency !== "EUR") return { decision: "decline", reason: `Unexpected currency ${r.currency}` };
  if (r.initiator === "merchant" && r.merchant_mcc === "4816") return { decision: "decline", reason: "Unknown merchant trying to charge a stored token" };
  if (!r.merchant_country) return { decision: "decline", reason: "Merchant does not state a country" };
  if (r.line_items?.some((l) => /shoe|boot/i.test(l.title)) && !SHOE_OR_SPORT_MCCS.includes(r.merchant_mcc)) {
    return { decision: "decline", reason: `MCC ${r.merchant_mcc} does not match the goods (shoes)` };
  }
  if (r.amount_minor > 20000) return { decision: "step_up", reason: "Amount above €200: ask the customer" };
  if (ageDays < 30) return { decision: "step_up", reason: `Merchant joined only ${Math.floor(ageDays)} days ago: ask the customer` };
  return { decision: "approve", reason: "Within limits, merchant looks established" };
}

const sigOk = (body: string, header: string | undefined, secret: string | null) =>
  !secret || header === "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (status: number, obj: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    if (req.method === "POST" && req.url === "/webhooks") {
      const ok = sigOk(body, req.headers["x-sandbox-signature"] as string, HOOK_SECRET);
      const e = JSON.parse(body);
      console.log(`[webhook${ok ? "" : " BAD SIGNATURE"}] ${e.type}: ${e.summary}`);
      return send(200, { received: true });
    }
    if (req.method === "POST" && req.url === "/authorise") {
      if (!sigOk(body, req.headers["x-sandbox-signature"] as string, AUTH_SECRET)) {
        console.log("[authorise] BAD SIGNATURE, declining");
        return send(200, { decision: "decline", reason: "Request signature invalid" });
      }
      const r = JSON.parse(body) as Req;
      if (MODE === "slow") return; // never answer
      const out = MODE === "rules" ? decide(r) : { decision: MODE, reason: `Mock leash in '${MODE}' mode` };
      console.log(
        `[authorise] ${(r.amount_minor / 100).toFixed(2)} ${r.currency} to ${r.merchant_name} (MCC ${r.merchant_mcc})` +
          `${r.line_items ? `, ${r.line_items.length} line items` : ", no basket details"} -> ${out.decision}: ${out.reason}`,
      );
      return send(200, out);
    }
    send(404, { error: "not found" });
  });
}).listen(PORT, () => console.log(`Mock leash on http://localhost:${PORT} (mode: ${MODE}). Ctrl+C to stop.`));
