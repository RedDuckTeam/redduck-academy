CREATE TABLE "project_user_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_lesson_id" integer NOT NULL,
	"repo_url" text NOT NULL,
	"commit_sha" text,
	"batch_request_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"feedback" jsonb,
	"error_message" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user_lessons" ADD COLUMN "attempts_left" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "project_user_submissions" ADD CONSTRAINT "project_user_submissions_user_lesson_id_user_lessons_id_fk" FOREIGN KEY ("user_lesson_id") REFERENCES "public"."user_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_user_submissions_user_lesson_id_idx" ON "project_user_submissions" USING btree ("user_lesson_id");--> statement-breakpoint
CREATE INDEX "project_user_submissions_user_lesson_submitted_idx" ON "project_user_submissions" USING btree ("user_lesson_id","submitted_at");