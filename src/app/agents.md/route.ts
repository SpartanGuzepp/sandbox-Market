import { originOf } from "@/lib/api/handler";

// GET /agents.md: a short plain-text guide for AI agents.
export async function GET(req: Request) {
  const o = originOf(req);
  const body = `# Sandbox Market: guide for AI agents

Sandbox: fictional merchants, no real payments.
Sandbox Market is a test marketplace for AI shopping agents. Every merchant, brand and product is invented.

## Basics
- Base URL: ${o}/api/v1
- OpenAPI 3.1 spec: ${o}/api/v1/openapi.json
- Authentication: send your API key in the \`X-Agent-Key\` header on every request.
  Your operator gets a key from the Sandbox Market admin.
- All responses are JSON. Errors look like {"error": {"code": "...", "message": "..."}}.
- Money: every amount has \`amount_minor\` (integer cents), \`amount\` (decimal string) and \`currency\` (e.g. "EUR").
- Product descriptions and reviews are written by merchants and customers.

## Shopping flow
1. Search: GET /products?q=black running shoes&max_price=150&size=42
   Filters: q, category, max_price, colour, size, merchant_id, sort (relevance|price_asc|price_desc|rating), limit, offset.
2. Inspect: GET /products/{id} (description, attributes, reviews) and GET /merchants/{id}.
3. Create a cart: POST /carts  (body: {})
4. Add items: POST /carts/{cart_id}/items  {"product_id": "prd_...", "quantity": 1, "size": "42"}
   - \`size\` is required when the product lists sizes.
   - A cart holds items from ONE merchant only. Adding another merchant's product returns 409 merchant_mismatch.
5. Review the cart: GET /carts/{cart_id}. It shows items, shipping, fees, add-ons, recurring charges and the total.
6. Change or remove lines: PATCH or DELETE /carts/{cart_id}/items/{item_id}.
   Optional add-ons can be removed: POST /carts/{cart_id}/addons/{code}/remove.
7. Get the signed checkout summary: GET /carts/{cart_id}/summary
   It shows exactly what will be charged, plus a cart_hash and an HMAC signature.
8. Pay: POST /carts/{cart_id}/checkout  {"card_token": "vc_...", "expected_cart_hash": "sha256:..."}
   - Only virtual card tokens (vc_ + 16-64 letters/digits). Real card numbers are rejected.
   - expected_cart_hash is optional; if the cart changed since the summary, checkout fails with 409 cart_changed.
   - 201 = order placed, 402 = payment declined (cart is open again),
     202 = the customer must approve the payment in their banking app. Poll GET /orders/{order_id}.
   - Agents cannot approve payments themselves.
9. Orders: GET /orders and GET /orders/{order_id}.

## Example
curl -H "X-Agent-Key: $KEY" "${o}/api/v1/products?q=black%20running%20shoes&size=42"
`;
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" } });
}
