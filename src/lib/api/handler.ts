// Small wrapper for API route handlers: authenticates the agent and turns errors into JSON.
import { authenticateAgent, type AgentIdentity } from "./auth";
import { ApiError, errorResponse } from "./errors";

export function withAgent<C>(fn: (req: Request, agent: AgentIdentity, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      const agent = await authenticateAgent(req);
      return await fn(req, agent, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Parse a JSON body; an empty body becomes {}. */
export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid_json", "The request body is not valid JSON.");
  }
}

/** The public base URL of this site, e.g. https://sandbox-market.vercel.app */
export function originOf(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  return new URL(req.url).origin;
}

/** Context for the shared agent operations (src/lib/agent-ops.ts). */
export function opCtx(req: Request, agent: AgentIdentity) {
  return { agent, origin: originOf(req), via: "api" as const };
}
