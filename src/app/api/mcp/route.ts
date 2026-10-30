// MCP endpoint (Streamable HTTP): the shop's actions as tools for AI assistants.
// Auth: the same agent API keys as the REST API, sent as X-Agent-Key or "Authorization: Bearer <key>".
import { createMcpHandler } from "mcp-handler";
import { authenticateAgent } from "@/lib/api/auth";
import { errorResponse } from "@/lib/api/errors";
import { originOf } from "@/lib/api/handler";
import { registerTools } from "@/lib/mcp/tools";

async function handle(req: Request) {
  let agent;
  try {
    agent = await authenticateAgent(req);
  } catch (e) {
    return errorResponse(e);
  }
  const ctx = { agent, origin: originOf(req), via: "mcp" as const };
  // A fresh, stateless server per request, bound to the calling agent.
  const handler = createMcpHandler((server) => registerTools(server, ctx), {
    serverInfo: { name: "sandbox-market", version: "1.0.0" },
    instructions:
      "Sandbox Market: a fictional test shop, no real payments. Flow: search_products -> get_product -> create_cart -> add_to_cart -> " +
      "view_cart -> get_checkout_summary -> checkout. One merchant per cart. Pay only with virtual card tokens (vc_…). Prices in EUR.",
  });
  return handler(req);
}

export { handle as GET, handle as POST, handle as DELETE };
