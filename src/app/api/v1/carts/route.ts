import { withAgent, opCtx, readJson } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { CreateCartBody } from "@/lib/api/schemas";
import { opCreateCart } from "@/lib/agent-ops";

// POST /api/v1/carts: create an empty cart owned by the calling agent.
export const POST = withAgent(async (req, agent) => {
  CreateCartBody.parse(await readJson(req));
  return json(await opCreateCart(opCtx(req, agent)), 201);
});
