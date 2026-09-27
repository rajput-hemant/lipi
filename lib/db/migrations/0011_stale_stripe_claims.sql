ALTER TABLE "lipi_stripe_webhook_events"
ADD COLUMN "claim_expires_at" timestamp with time zone DEFAULT now() + interval '5 minutes' NOT NULL;
