// Agent authentication: every /api/v1 call (except the OpenAPI spec) needs an X-Agent-Key header.
import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { agentKeys } from "@/db/schema";
import { ApiError } from "./errors";

export type AgentIdentity = { id: string; name: string };

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export async function authenticateAgent(req: Request): Promise<AgentIdentity> {
  const key = req.headers.get("x-agent-key")?.trim();
  if (!key) {
    throw new ApiError(401, "missing_agent_key", "Send your API key in the X-Agent-Key header. See /agents.md.");
  }
  const [row] = await db
    .select({ id: agentKeys.id, name: agentKeys.name })
    .from(agentKeys)
    .where(and(eq(agentKeys.keyHash, hashKey(key)), isNull(agentKeys.revokedAt)))
    .limit(1);
  if (!row) throw new ApiError(401, "invalid_agent_key", "This API key is unknown or has been revoked.");
  // Record last use without slowing the request down.
  void db.update(agentKeys).set({ lastUsedAt: new Date() }).where(eq(agentKeys.id, row.id)).catch(() => {});
  return row;
}
