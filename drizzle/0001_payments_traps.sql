CREATE TABLE "attack_scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"target_product_id" text,
	"target_merchant_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authorisations" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"authoriser" text NOT NULL,
	"request" jsonb NOT NULL,
	"response" jsonb,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"http_status" integer,
	"error" text,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"cart_id" text,
	"channel" text NOT NULL,
	"agent_key_id" text,
	"merchant_id" text NOT NULL,
	"status" text NOT NULL,
	"currency" text NOT NULL,
	"total_minor" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"card_token" text NOT NULL,
	"cart_hash" text,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"subscription_id" text,
	"decision" text,
	"decision_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"title" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"card_token" text NOT NULL,
	"interval" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"next_renewal_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"url" text NOT NULL,
	"status_code" integer,
	"error" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "removed_addons" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "trap_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "trap_id" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "trap_id" text;--> statement-breakpoint
CREATE INDEX "authorisations_order_idx" ON "authorisations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_cart_idx" ON "orders" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "orders_agent_idx" ON "orders" USING btree ("agent_key_id");