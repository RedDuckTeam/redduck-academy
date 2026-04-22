ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "privy_user_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_privy_user_id_unique" UNIQUE("privy_user_id");