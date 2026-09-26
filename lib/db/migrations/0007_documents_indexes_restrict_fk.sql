CREATE INDEX IF NOT EXISTS "lipi_documents_workspace_id_idx" ON "lipi_documents" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lipi_documents_parent_id_idx" ON "lipi_documents" USING btree ("parent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lipi_documents_workspace_parent_idx" ON "lipi_documents" USING btree ("workspace_id","parent_id");
--> statement-breakpoint
ALTER TABLE "lipi_documents" DROP CONSTRAINT IF EXISTS "lipi_documents_parent_id_lipi_documents_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_documents" ADD CONSTRAINT "lipi_documents_parent_id_lipi_documents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lipi_documents"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
