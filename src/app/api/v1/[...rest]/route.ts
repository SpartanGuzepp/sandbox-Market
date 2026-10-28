import { json } from "@/lib/api/errors";

// Any unknown /api/v1 path returns a JSON 404 instead of an HTML page.
const notFound = () =>
  json({ error: { code: "not_found", message: "Unknown API endpoint. See /api/v1/openapi.json." } }, 404);
export { notFound as GET, notFound as POST, notFound as PATCH, notFound as DELETE, notFound as PUT };
