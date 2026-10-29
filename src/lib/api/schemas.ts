// Request schemas. They validate input AND are used to generate the OpenAPI spec,
// so the documentation can't drift away from what the code accepts.
import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";

export const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const SearchQuery = z.object({
  q: z.string().max(200).optional().describe("Free-text search, e.g. 'black running shoes'."),
  category: z.enum(categoryIds).optional(),
  max_price: z
    .string()
    .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a number in euros, e.g. 120 or 120.50")
    .optional()
    .describe("Maximum unit price in the product currency (EUR), e.g. 120 or 120.50."),
  colour: z.string().max(40).optional().describe("Exact colour, e.g. black."),
  size: z.string().max(20).optional().describe("Size that must be available, e.g. 42 (shoes), M (apparel), 39-42 (socks)."),
  merchant_id: z.string().max(60).optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "rating"]).default("relevance"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CreateCartBody = z.object({}).strict().describe("No fields needed. Send {} or an empty body.");

export const AddItemBody = z
  .object({
    product_id: z.string().min(1).describe("Product id, e.g. prd_alp_run_001."),
    quantity: z.number().int().min(1).max(10).default(1),
    size: z
      .union([z.string(), z.number()])
      .transform((v) => String(v))
      .optional()
      .describe("Required when the product has sizes. Must be one of the product's attributes.sizes."),
  })
  .strict();

export const UpdateItemBody = z.object({ quantity: z.number().int().min(1).max(10) }).strict();

export const CheckoutBody = z
  .object({
    card_token: z.string().max(300).describe("Virtual card token, e.g. vc_demo4f8a2c9e1b7d3a6f. Real card numbers are rejected."),
    expected_cart_hash: z
      .string()
      .max(200)
      .optional()
      .describe("Optional. cart_hash from GET /carts/{id}/summary. Checkout fails with 409 cart_changed if the cart changed since."),
  })
  .strict();
