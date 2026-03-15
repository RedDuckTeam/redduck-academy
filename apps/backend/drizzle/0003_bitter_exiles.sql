CREATE TABLE "user_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"score" integer,
	"user_answers" jsonb,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payload"."lessons" RENAME COLUMN "max_score" TO "max_points";--> statement-breakpoint
ALTER TABLE "user_lessons" ADD CONSTRAINT "user_lessons_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payload"."lessons" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "payload"."lessons" DROP COLUMN "boilerplate";--> statement-breakpoint
ALTER TABLE "payload"."lessons" DROP COLUMN "test_suite";--> statement-breakpoint
ALTER TABLE "payload"."lessons" DROP COLUMN "review_description";--> statement-breakpoint
ALTER TABLE "payload"."lessons" DROP COLUMN "rubric";