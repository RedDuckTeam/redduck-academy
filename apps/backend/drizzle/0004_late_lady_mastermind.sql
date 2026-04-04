CREATE TABLE "coding_task_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_lesson_id" integer NOT NULL,
	"submitted_code" text NOT NULL,
	"language" text NOT NULL,
	"passed" boolean NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coding_task_submissions" ADD CONSTRAINT "coding_task_submissions_user_lesson_id_user_lessons_id_fk" FOREIGN KEY ("user_lesson_id") REFERENCES "public"."user_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coding_task_submissions_user_lesson_id_idx" ON "coding_task_submissions" USING btree ("user_lesson_id");