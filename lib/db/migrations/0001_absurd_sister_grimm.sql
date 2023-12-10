CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"username" text,
	"password" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "lipi_users" RENAME TO "lipi_accounts";--> statement-breakpoint
ALTER TABLE "lipi_accounts" RENAME COLUMN "id" TO "user_id";--> statement-breakpoint
ALTER TABLE "lipi_collaborators" DROP CONSTRAINT "lipi_collaborators_user_id_lipi_users_id_fk";
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'lipi_accounts'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "lipi_accounts" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_collaborators" ADD CONSTRAINT "lipi_collaborators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lipi_accounts" ADD CONSTRAINT "lipi_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "lipi_accounts" DROP COLUMN IF EXISTS "full_name";--> statement-breakpoint
ALTER TABLE "lipi_accounts" DROP COLUMN IF EXISTS "avatar_url";--> statement-breakpoint
ALTER TABLE "lipi_accounts" DROP COLUMN IF EXISTS "email";