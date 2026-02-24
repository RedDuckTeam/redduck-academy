CREATE TABLE "payload"."lessons_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"question" text NOT NULL,
	"points" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payload"."lessons_questions_options" (
	"id" text PRIMARY KEY NOT NULL,
	"_order" integer NOT NULL,
	"_parent_id" text NOT NULL,
	"label" text NOT NULL,
	"is_correct" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payload"."lessons_questions" ADD CONSTRAINT "lessons_questions__parent_id_lessons_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payload"."lessons_questions_options" ADD CONSTRAINT "lessons_questions_options__parent_id_lessons_questions_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payload"."lessons" DROP COLUMN "questions";