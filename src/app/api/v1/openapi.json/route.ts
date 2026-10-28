import { buildOpenApi } from "@/lib/api/openapi";
import { originOf } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";

// GET /api/v1/openapi.json: public, no API key needed.
export async function GET(req: Request) {
  return json(buildOpenApi(originOf(req)));
}
