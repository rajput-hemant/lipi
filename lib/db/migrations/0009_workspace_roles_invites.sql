CREATE TYPE "public"."workspace_collaborator_role" AS ENUM('editor', 'viewer');--> statement-breakpoint
CREATE TABLE "lipi_workspace_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "workspace_collaborator_role" DEFAULT 'editor' NOT NULL,
	"token" text NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lipi_workspace_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "lipi_collaborators" ADD COLUMN "role" "workspace_collaborator_role" DEFAULT 'editor' NOT NULL;--> statement-breakpoint
ALTER TABLE "lipi_workspace_invites" ADD CONSTRAINT "lipi_workspace_invites_workspace_id_lipi_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lipi_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lipi_workspace_invites" ADD CONSTRAINT "lipi_workspace_invites_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
