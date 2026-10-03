CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX "lipi_documents_title_trgm_idx" ON "lipi_documents" USING gin ("title" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "lipi_documents_content_trgm_idx" ON "lipi_documents" USING gin ("content" gin_trgm_ops);
