CREATE TABLE "coding_task_review_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"passed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "coding_task_review_cache_lesson_id_code_hash_unique" ON "coding_task_review_cache" USING btree ("lesson_id","code_hash");
