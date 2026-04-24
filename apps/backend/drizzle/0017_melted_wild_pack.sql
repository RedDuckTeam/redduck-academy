ALTER TABLE "coding_task_submissions" ADD COLUMN "ip_address" text;--> statement-breakpoint
CREATE INDEX "coding_task_submissions_user_lesson_submitted_at_idx" ON "coding_task_submissions" USING btree ("user_lesson_id","submitted_at");--> statement-breakpoint
CREATE INDEX "coding_task_submissions_ip_submitted_at_idx" ON "coding_task_submissions" USING btree ("ip_address","submitted_at");