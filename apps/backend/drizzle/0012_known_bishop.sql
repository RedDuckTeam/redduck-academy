ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "blacklisted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");