CREATE TABLE "content_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"branch" text NOT NULL,
	"pr_number" integer NOT NULL,
	"door" text NOT NULL,
	"ip_hash" text,
	"privy_user_id" text,
	"license_version" text NOT NULL,
	"license_accepted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "content_proposals_ip_window_idx" ON "content_proposals" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "content_proposals_user_window_idx" ON "content_proposals" USING btree ("privy_user_id","created_at");--> statement-breakpoint
CREATE INDEX "content_proposals_path_window_idx" ON "content_proposals" USING btree ("path","created_at");--> statement-breakpoint
CREATE INDEX "content_proposals_created_at_idx" ON "content_proposals" USING btree ("created_at");