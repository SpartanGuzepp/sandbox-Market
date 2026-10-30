// MCP tools: the same actions as the REST API, via the shared agent operations.
// There are deliberately no approve/reject tools: only the customer can approve a payment.
import type { McpServer } from "@modelcontextprotocol/server";
import { z, ZodError } from "zod";
import { ApiError } from "@/lib/api/errors";
import { categoryIds } from "@/lib/api/schemas";
import * as ops from "@/lib/agent-ops";

const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });

async function run(fn: () => Promise<unknown> | unknown) {
  try {
    return result(await fn());
  } catch (e) {
    const error =
      e instanceof ApiError
        ? { code: e.code, message: e.message, ...(e.details ? { details: e.details } : {}) }
        : e instanceof ZodError
          ? { code: "invalid_request", message: "The request is invalid.", details: e.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }
          : { code: "internal_error", message: "Something went wrong on our side." };
    if (!(e instanceof ApiError) && !(e instanceof ZodError)) console.error(e);
    return { ...result({ error }), isError: true };
  }
}

const id = (what: string, example: string) => z.string().min(1).describe(`${what} id, e.g. ${example}`);

export function registerTools(server: McpServer, c: ops.OpContext) {
  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description: "Search the catalogue. All filters are optional. Prices are in EUR.",
      inputSchema: z.object({
        q: z.string().max(200).optional().describe("Free text, e.g. 'black running shoes'"),
        category: z.enum(categoryIds).optional(),
        max_price: z.union([z.number(), z.string()]).optional().describe("Maximum unit price in euros, e.g. 120"),
        colour: z.string().optional().describe("Exact colour, e.g. black"),
        size: z.string().optional().describe("Size that must be available, e.g. 42, M or 39-42"),
        merchant_id: z.string().optional(),
        sort: z.enum(["relevance", "price_asc", "price_desc", "rating"]).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }),
    },
    (a) => run(() => ops.opSearchProducts(c, { ...a, max_price: a.max_price === undefined ? undefined : String(a.max_price) })),
  );

  server.registerTool(
    "get_product",
    { title: "Get product", description: "Full product details: attributes, description, seller notice and reviews.", inputSchema: z.object({ product_id: id("Product", "prd_alp_run_001") }) },
    (a) => run(() => ops.opGetProduct(c, a.product_id)),
  );

  server.registerTool(
    "list_merchants",
    { title: "List merchants", description: "All merchants with country, MCC, join date, rating and return policy.", inputSchema: z.object({}) },
    () => run(() => ops.opListMerchants(c)),
  );

  server.registerTool(
    "get_merchant",
    { title: "Get merchant", description: "One merchant's details.", inputSchema: z.object({ merchant_id: id("Merchant", "mer_alpenstride") }) },
    (a) => run(() => ops.opGetMerchant(c, a.merchant_id)),
  );

  server.registerTool(
    "list_categories",
    { title: "List categories", description: "Product categories.", inputSchema: z.object({}) },
    () => run(() => ops.opListCategories()),
  );

  server.registerTool(
    "create_cart",
    { title: "Create cart", description: "Create an empty cart. A cart can only hold items from ONE merchant.", inputSchema: z.object({}) },
    () => run(() => ops.opCreateCart(c)),
  );

  server.registerTool(
    "view_cart",
    { title: "View cart", description: "The cart with items, shipping, fees, add-ons, recurring charges and total.", inputSchema: z.object({ cart_id: id("Cart", "crt_…") }) },
    (a) => run(() => ops.opGetCart(c, a.cart_id)),
  );

  server.registerTool(
    "add_to_cart",
    {
      title: "Add to cart",
      description: "Add a product. size is required when the product lists sizes. Adding the same product and size again increases the quantity.",
      inputSchema: z.object({
        cart_id: id("Cart", "crt_…"),
        product_id: id("Product", "prd_alp_run_001"),
        quantity: z.number().int().min(1).max(10).default(1),
        size: z.union([z.string(), z.number()]).optional().describe("e.g. 42, M or 39-42"),
      }),
    },
    (a) =>
      run(() => ops.opAddItem(c, a.cart_id, { product_id: a.product_id, quantity: a.quantity, size: a.size === undefined ? undefined : String(a.size) })),
  );

  server.registerTool(
    "update_cart_item",
    {
      title: "Change quantity",
      description: "Change the quantity of a cart line.",
      inputSchema: z.object({ cart_id: id("Cart", "crt_…"), item_id: id("Cart item", "itm_…"), quantity: z.number().int().min(1).max(10) }),
    },
    (a) => run(() => ops.opUpdateItem(c, a.cart_id, a.item_id, { quantity: a.quantity })),
  );

  server.registerTool(
    "remove_cart_item",
    { title: "Remove item", description: "Remove a line from the cart.", inputSchema: z.object({ cart_id: id("Cart", "crt_…"), item_id: id("Cart item", "itm_…") }) },
    (a) => run(() => ops.opRemoveItem(c, a.cart_id, a.item_id)),
  );

  server.registerTool(
    "remove_addon",
    { title: "Remove add-on", description: "Remove an optional add-on from the cart.", inputSchema: z.object({ cart_id: id("Cart", "crt_…"), code: z.string().describe("Add-on code from the cart's addons list") }) },
    (a) => run(() => ops.opRemoveAddon(c, a.cart_id, a.code)),
  );

  server.registerTool(
    "get_checkout_summary",
    {
      title: "Checkout summary",
      description: "Exactly what checkout will charge, with cart_hash and an HMAC signature. Pass cart_hash to checkout as expected_cart_hash.",
      inputSchema: z.object({ cart_id: id("Cart", "crt_…") }),
    },
    (a) => run(() => ops.opGetSummary(c, a.cart_id)),
  );

  server.registerTool(
    "checkout",
    {
      title: "Checkout",
      description:
        "Pay for the cart with a virtual card token (vc_…). The result is the order: status placed, declined, or awaiting_customer_approval " +
        "(the customer must approve in their banking app; check later with get_order).",
      inputSchema: z.object({
        cart_id: id("Cart", "crt_…"),
        // Numbers are accepted too, so a real card number sent as a number is still caught and refused.
        card_token: z.union([z.string(), z.number()]).describe("Virtual card token, e.g. vc_demo4f8a2c9e1b7d3a6f"),
        expected_cart_hash: z.string().optional().describe("cart_hash from get_checkout_summary"),
      }),
    },
    (a) => run(async () => (await ops.opCheckout(c, a.cart_id, { card_token: String(a.card_token), expected_cart_hash: a.expected_cart_hash })).order),
  );

  server.registerTool(
    "list_orders",
    { title: "List orders", description: "Your orders, newest first.", inputSchema: z.object({}) },
    () => run(() => ops.opListOrders(c)),
  );

  server.registerTool(
    "get_order",
    { title: "Get order", description: "One order and its payment decision.", inputSchema: z.object({ order_id: id("Order", "ord_…") }) },
    (a) => run(() => ops.opGetOrder(c, a.order_id)),
  );
}
