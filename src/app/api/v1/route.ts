import { originOf } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";

// GET /api/v1: small index so agents can find their way.
export async function GET(req: Request) {
  const o = originOf(req);
  return json({
    name: "Sandbox Market Agent API",
    notice: "Sandbox: fictional merchants, no real payments.",
    guide: `${o}/agents.md`,
    openapi: `${o}/api/v1/openapi.json`,
    auth: "Send your API key in the X-Agent-Key header.",
  });
}
