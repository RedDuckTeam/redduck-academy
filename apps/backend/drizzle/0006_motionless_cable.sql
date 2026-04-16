CREATE TABLE "coding_task_review_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"passed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"ip_address" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"attempts_used" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"window_duration_hours" integer DEFAULT 1 NOT NULL,
	"exhaust_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_slug" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "skip_prerequisites" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_rate_limits" ADD CONSTRAINT "submission_rate_limits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coding_task_review_cache_lesson_id_code_hash_unique" ON "coding_task_review_cache" USING btree ("lesson_id","code_hash");--> statement-breakpoint
CREATE INDEX "submission_rate_limits_ip_lesson_idx" ON "submission_rate_limits" USING btree ("ip_address","lesson_id");--> statement-breakpoint
CREATE INDEX "submission_rate_limits_user_lesson_idx" ON "submission_rate_limits" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_certificates_user_id_course_slug_unique" ON "user_certificates" USING btree ("user_id","course_slug");--> statement-breakpoint
ALTER TABLE "user_lessons" DROP COLUMN "score";--> statement-breakpoint
ALTER TABLE "user_lessons" DROP COLUMN "attempts_left";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "points";--> statement-breakpoint
ALTER TABLE "wallet_address" DROP COLUMN "chain_id";