DO $$ BEGIN
 CREATE TYPE "pricing_plan_interval" AS ENUM('year', 'month', 'week', 'day');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "pricing_type" AS ENUM('recurring', 'one_time');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_status" AS ENUM('unpaid', 'past_due', 'incomplete_expired', 'incomplete', 'canceled', 'active', 'trialing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_customers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"stripe_customer_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"icon_id" text NOT NULL,
	"data" text,
	"logo" text,
	"banner_url" text,
	"workspace_id" uuid,
	"folder_id" uuid,
	"in_trash" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"icon_id" text NOT NULL,
	"data" text,
	"logo" text,
	"banner_url" text,
	"workspace_id" uuid,
	"in_trash" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"active" boolean,
	"description" text,
	"unit_amount" bigint,
	"currency" text,
	"type" "pricing_type",
	"interval" "pricing_plan_interval",
	"interval_count" integer,
	"trial_period_days" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_products" (
	"id" text PRIMARY KEY NOT NULL,
	"active" boolean,
	"name" text,
	"description" text,
	"image" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "subscription_status",
	"metadata" jsonb,
	"price_id" text,
	"quantity" integer,
	"cancel_at_period_end" boolean,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone DEFAULT now(),
	"cancel_at" timestamp with time zone DEFAULT now(),
	"canceled_at" timestamp with time zone DEFAULT now(),
	"trial_start" timestamp with time zone DEFAULT now(),
	"trial_end" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"billing_address" jsonb,
	"updated_at" timestamp with time zone,
	"payment_method" jsonb,
	"email" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lipi_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"icon_id" text NOT NULL,
	"data" text,
	"logo" text,
	"banner_url" text,
	"workspace_owner_id" uuid NOT NULL,
	"in_trash" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_collaborators" ADD CONSTRAINT "lipi_collaborators_workspace_id_lipi_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "lipi_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_collaborators" ADD CONSTRAINT "lipi_collaborators_user_id_lipi_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "lipi_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_files" ADD CONSTRAINT "lipi_files_workspace_id_lipi_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "lipi_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_files" ADD CONSTRAINT "lipi_files_folder_id_lipi_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "lipi_folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_folders" ADD CONSTRAINT "lipi_folders_workspace_id_lipi_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "lipi_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_prices" ADD CONSTRAINT "lipi_prices_product_id_lipi_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "lipi_products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_subscriptions" ADD CONSTRAINT "lipi_subscriptions_price_id_lipi_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "lipi_prices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
