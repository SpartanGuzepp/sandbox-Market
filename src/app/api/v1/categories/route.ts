import { withAgent } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { opListCategories } from "@/lib/agent-ops";

// GET /api/v1/categories
export const GET = withAgent(async () => json(opListCategories()));
