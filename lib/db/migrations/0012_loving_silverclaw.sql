CREATE TABLE "lipi_realtime_documents" (
	"document_id" uuid PRIMARY KEY NOT NULL,
	"state" "bytea" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lipi_realtime_documents" ADD CONSTRAINT "lipi_realtime_documents_document_id_lipi_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."lipi_documents"("id") ON DELETE cascade ON UPDATE no action;