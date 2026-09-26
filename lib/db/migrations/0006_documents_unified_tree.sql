CREATE TABLE IF NOT EXISTS "lipi_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"banner_url" text,
	"content" text,
	"in_trash" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_documents" ADD CONSTRAINT "lipi_documents_workspace_id_lipi_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lipi_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_documents" ADD CONSTRAINT "lipi_documents_parent_id_lipi_documents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lipi_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "lipi_documents" (
	"id",
	"workspace_id",
	"parent_id",
	"title",
	"icon",
	"banner_url",
	"content",
	"in_trash",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	"workspace_id",
	NULL,
	"title",
	"icon_id",
	"banner_url",
	"data",
	"in_trash",
	COALESCE("created_at", now()),
	COALESCE("created_at", now())
FROM "lipi_folders"
WHERE "workspace_id" IS NOT NULL;
--> statement-breakpoint
INSERT INTO "lipi_documents" (
	"id",
	"workspace_id",
	"parent_id",
	"title",
	"icon",
	"banner_url",
	"content",
	"in_trash",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	"workspace_id",
	"folder_id",
	"title",
	"icon_id",
	"banner_url",
	"data",
	"in_trash",
	COALESCE("created_at", now()),
	COALESCE("created_at", now())
FROM "lipi_files"
WHERE "workspace_id" IS NOT NULL;
--> statement-breakpoint
DROP TABLE IF EXISTS "lipi_files";
--> statement-breakpoint
DROP TABLE IF EXISTS "lipi_folders";
