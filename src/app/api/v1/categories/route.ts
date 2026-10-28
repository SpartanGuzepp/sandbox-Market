import { withAgent } from "@/lib/api/handler";
import { json } from "@/lib/api/errors";
import { CATEGORIES } from "@/lib/categories";

// GET /api/v1/categories
export const GET = withAgent(async () => json({ items: CATEGORIES }));
