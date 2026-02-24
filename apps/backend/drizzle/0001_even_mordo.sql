CREATE SCHEMA "payload";
--> statement-breakpoint
CREATE TABLE "payload"."courses" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image_id" integer,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payload"."lessons" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"module_id" integer NOT NULL,
	"order" integer NOT NULL,
	"type" text NOT NULL,
	"content" jsonb,
	"questions" jsonb,
	"description" jsonb,
	"language" text,
	"boilerplate" text,
	"test_suite" text,
	"review_description" jsonb,
	"rubric" text,
	"max_score" integer,
	"updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payload"."modules" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"course_id" integer NOT NULL,
	"order" integer NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payload"."lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "payload"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payload"."modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;