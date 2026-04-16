-- Feature 1: Remove points system
ALTER TABLE "user" DROP COLUMN "points";
ALTER TABLE "user_lessons" DROP COLUMN "score";
--> statement-breakpoint
-- Feature 2: Remove attemptsLeft, add rate limits table
ALTER TABLE "user_lessons" DROP COLUMN "attempts_left";
--> statement-breakpoint
CREATE TABLE "submission_rate_limits" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE set null,
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
CREATE INDEX "submission_rate_limits_ip_lesson_idx" ON "submission_rate_limits" ("ip_address","lesson_id");
--> statement-breakpoint
CREATE INDEX "submission_rate_limits_user_lesson_idx" ON "submission_rate_limits" ("user_id","lesson_id");
--> statement-breakpoint
-- Feature 3: Add skipPrerequisites to user
ALTER TABLE "user" ADD COLUMN "skip_prerequisites" boolean DEFAULT false NOT NULL;
