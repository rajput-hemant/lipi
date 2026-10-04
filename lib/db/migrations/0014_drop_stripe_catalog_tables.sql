ALTER TABLE "lipi_subscriptions" DROP CONSTRAINT "lipi_subscriptions_price_id_lipi_prices_id_fk";
--> statement-breakpoint
DROP TABLE "lipi_prices";
--> statement-breakpoint
DROP TABLE "lipi_products";
--> statement-breakpoint
DROP TABLE "lipi_accounts";
--> statement-breakpoint
DROP TYPE "public"."pricing_plan_interval";
--> statement-breakpoint
DROP TYPE "public"."pricing_type";
