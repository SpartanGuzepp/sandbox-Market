import { json } from "@/lib/api/errors";

// MCP clients look for OAuth metadata here when a request is refused. Sandbox Market doesn't use OAuth,
// so answer with a JSON 404 that explains how to authenticate (instead of an HTML page clients can't parse).
const noOAuth = () =>
  json(
    {
      error: {
        code: "oauth_not_supported",
        message: "Sandbox Market does not use OAuth. Send your agent API key as 'X-Agent-Key: ak_…' or 'Authorization: Bearer ak_…'.",
      },
    },
    404,
  );
export { noOAuth as GET, noOAuth as POST };
