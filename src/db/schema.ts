// Database schema (Drizzle). Each `pgTable` below becomes one Postgres table.
// Money is always stored as whole cents ("minor units"): 4990 = 49.90.
import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type TrustProfile = {
  label: "reputable" | "new_legitimate" | "shady" | "lookalike";
  notes: string;
};

export type ProductAttributes = {
  colour?: string;
  sizes?: string[];
  material?: string;
  [key: string]: string | string[] | number | boolean | undefined;
};

export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(), // ISO 3166 alpha-2, or "XX" = not stated
  mcc: text("mcc").notNull(), // merchant category code
  currency: text("currency").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
  rating: real("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  returnPolicy: text("return_policy").notNull(),
  description: text("description").notNull(),
  brandColour: text("brand_colour").notNull(), // used for the generated logo
  // Ground truth for the project owner only. Never returned by the API or shown on the shop pages.
  trustProfile: jsonb("trust_profile").$type<TrustProfile>().notNull(),
  lookalikeOf: text("lookalike_of"), // ground truth only
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    attributes: jsonb("attributes").$type<ProductAttributes>().notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: text("currency").notNull(),
    shippingMinor: integer("shipping_minor").notNull(),
    description: text("description").notNull(),
    isRecurring: boolean("is_recurring").notNull().default(false),
    billingInterval: text("billing_interval"), // "month" for subscriptions
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("products_merchant_idx").on(t.merchantId), index("products_category_idx").on(t.category)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const agentKeys = pgTable(
  "agent_keys",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(), // first characters, safe to display
    keyHash: text("key_hash").notNull(), // SHA-256 of the full key; the key itself is never stored
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("agent_keys_hash_idx").on(t.keyHash)],
);

export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  // One cart = one merchant. Set when the first item is added.
  merchantId: text("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
  currency: text("currency"),
  status: text("status").notNull().default("open"), // open | checked_out
  channel: text("channel").notNull(), // "api" (agent) or "web" (human in the browser)
  agentKeyId: text("agent_key_id").references(() => agentKeys.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    size: text("size"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cart_items_cart_idx").on(t.cartId)],
);

// One append-only log of everything that happens. Powers the activity log,
// the demo timeline (Phase 3) and webhooks (Phase 3).
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    actorType: text("actor_type").notNull(), // agent | web | admin | customer | system | authoriser
    actorId: text("actor_id"), // e.g. agent key id
    actorName: text("actor_name"),
    type: text("type").notNull(), // e.g. "cart.item_added"
    cartId: text("cart_id"),
    orderId: text("order_id"),
    summary: text("summary").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [index("events_ts_idx").on(t.ts), index("events_type_idx").on(t.type)],
);

export type Merchant = typeof merchants.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type AgentKey = typeof agentKeys.$inferSelect;
export type EventRow = typeof events.$inferSelect;
