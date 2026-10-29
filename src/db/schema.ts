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
  // If set, this merchant only exists while that trap is switched on (ground truth only).
  trapId: text("trap_id"),
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
    // If set, this product only exists while that trap is switched on (ground truth only).
    trapId: text("trap_id"),
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
    trapId: text("trap_id"), // review only exists while that trap is on (ground truth only)
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
  status: text("status").notNull().default("open"), // open | awaiting_approval | checked_out
  channel: text("channel").notNull(), // "api" (agent) or "web" (human in the browser)
  agentKeyId: text("agent_key_id").references(() => agentKeys.id, { onDelete: "set null" }),
  // Codes of optional add-ons the shopper explicitly removed (see trap T07).
  removedAddons: jsonb("removed_addons").$type<string[]>().notNull().default([]),
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

// ---------- Phase 3: traps, orders, payments, subscriptions, webhooks ----------

export const attackScenarios = pgTable("attack_scenarios", {
  id: text("id").primaryKey(), // T01..T11
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(), // ground truth: what the trap does and what a good agent/leash should do
  enabled: boolean("enabled").notNull().default(true),
  targetProductId: text("target_product_id"),
  targetMerchantId: text("target_merchant_id"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderSnapshot = {
  lines: {
    product_id: string;
    title: string;
    category: string;
    size: string | null;
    quantity: number;
    unit_price_minor: number;
    line_total_minor: number;
    is_recurring: boolean;
  }[];
  subtotal_minor: number;
  shipping_minor: number;
  fees: { code: string; label: string; amount_minor: number }[];
  addons: { code: string; label: string; amount_minor: number }[];
  total_minor: number;
};

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    // checkout = customer/agent checkout; renewal = subscription renewal; merchant_initiated = charge started by a merchant
    kind: text("kind").notNull(),
    cartId: text("cart_id"),
    channel: text("channel").notNull(), // api | web | system
    agentKeyId: text("agent_key_id"),
    merchantId: text("merchant_id").notNull(),
    // pending_authorisation | placed | declined | awaiting_customer_approval | rejected_by_customer | refunded
    status: text("status").notNull(),
    currency: text("currency").notNull(),
    totalMinor: integer("total_minor").notNull(),
    snapshot: jsonb("snapshot").$type<OrderSnapshot>().notNull(),
    cardToken: text("card_token").notNull(),
    cartHash: text("cart_hash"),
    isRecurring: boolean("is_recurring").notNull().default(false),
    subscriptionId: text("subscription_id"),
    decision: text("decision"), // approve | decline | step_up
    decisionReason: text("decision_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_cart_idx").on(t.cartId), index("orders_agent_idx").on(t.agentKeyId)],
);

export const authorisations = pgTable(
  "authorisations",
  {
    id: text("id").primaryKey(), // also the request_id sent to the authoriser
    orderId: text("order_id").notNull(),
    authoriser: text("authoriser").notNull(), // no_leash | http
    request: jsonb("request").$type<Record<string, unknown>>().notNull(),
    response: jsonb("response").$type<Record<string, unknown> | null>(),
    decision: text("decision").notNull(),
    reason: text("reason").notNull(),
    httpStatus: integer("http_status"),
    error: text("error"),
    latencyMs: integer("latency_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("authorisations_order_idx").on(t.orderId)],
);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(), // the order that started it
  productId: text("product_id").notNull(),
  merchantId: text("merchant_id").notNull(),
  title: text("title").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  cardToken: text("card_token").notNull(), // stored token, charged again on renewal
  interval: text("interval").notNull(),
  status: text("status").notNull().default("active"), // active | cancelled
  nextRenewalAt: timestamp("next_renewal_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  eventType: text("event_type").notNull(),
  url: text("url").notNull(),
  statusCode: integer("status_code"),
  error: text("error"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Merchant = typeof merchants.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type AgentKey = typeof agentKeys.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type AttackScenario = typeof attackScenarios.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Authorisation = typeof authorisations.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
