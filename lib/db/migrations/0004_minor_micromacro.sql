ALTER TABLE "lipi_files" ALTER COLUMN "in_trash" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "lipi_files" ALTER COLUMN "in_trash" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "lipi_folders" ALTER COLUMN "in_trash" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "lipi_folders" ALTER COLUMN "in_trash" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "lipi_workspaces" ALTER COLUMN "in_trash" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "lipi_workspaces" ALTER COLUMN "in_trash" SET DEFAULT false;