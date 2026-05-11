import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."lessons_blocks_case_steps_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_case_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"function_name" varchar,
  	"value_wei" varchar,
  	"caller" varchar,
  	"expected" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_case" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  DROP TABLE "payload"."lessons_blocks_return_assertion_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_return_assertion" CASCADE;
  DROP TABLE "payload"."lessons_blocks_post_check_assertion_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_post_check_assertion_post_check_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_post_check_assertion" CASCADE;
  DROP TABLE "payload"."lessons_blocks_sequence_steps_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_sequence_steps" CASCADE;
  DROP TABLE "payload"."lessons_blocks_sequence_post_check_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_sequence" CASCADE;
  ALTER TABLE "payload"."lessons_blocks_case_steps_args" ADD CONSTRAINT "lessons_blocks_case_steps_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_case_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_case_steps" ADD CONSTRAINT "lessons_blocks_case_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_case"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_case" ADD CONSTRAINT "lessons_blocks_case_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_blocks_case_steps_args_order_idx" ON "payload"."lessons_blocks_case_steps_args" USING btree ("_order");
  CREATE INDEX "lessons_blocks_case_steps_args_parent_id_idx" ON "payload"."lessons_blocks_case_steps_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_case_steps_order_idx" ON "payload"."lessons_blocks_case_steps" USING btree ("_order");
  CREATE INDEX "lessons_blocks_case_steps_parent_id_idx" ON "payload"."lessons_blocks_case_steps" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_case_order_idx" ON "payload"."lessons_blocks_case" USING btree ("_order");
  CREATE INDEX "lessons_blocks_case_parent_id_idx" ON "payload"."lessons_blocks_case" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_case_path_idx" ON "payload"."lessons_blocks_case" USING btree ("_path");
  DROP TYPE "payload"."enum_lessons_blocks_sequence_assertion";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_lessons_blocks_sequence_assertion" AS ENUM('lastReturn', 'postCheck');
  CREATE TABLE "payload"."lessons_blocks_return_assertion_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_return_assertion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"function_name" varchar,
  	"value_wei" varchar,
  	"caller" varchar,
  	"expected" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_post_check_assertion_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_post_check_assertion_post_check_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_post_check_assertion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"function_name" varchar,
  	"value_wei" varchar,
  	"caller" varchar,
  	"post_check_function_name" varchar,
  	"post_check_caller" varchar,
  	"expected" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_sequence_steps_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_sequence_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"function_name" varchar,
  	"value_wei" varchar,
  	"caller" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_sequence_post_check_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_blocks_sequence" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"assertion" "payload"."enum_lessons_blocks_sequence_assertion" DEFAULT 'lastReturn',
  	"post_check_function_name" varchar,
  	"post_check_caller" varchar,
  	"expected" varchar,
  	"block_name" varchar
  );
  
  DROP TABLE "payload"."lessons_blocks_case_steps_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_case_steps" CASCADE;
  DROP TABLE "payload"."lessons_blocks_case" CASCADE;
  ALTER TABLE "payload"."lessons_blocks_return_assertion_args" ADD CONSTRAINT "lessons_blocks_return_assertion_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_return_assertion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_return_assertion" ADD CONSTRAINT "lessons_blocks_return_assertion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion_args" ADD CONSTRAINT "lessons_blocks_post_check_assertion_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_post_check_assertion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion_post_check_args" ADD CONSTRAINT "lessons_blocks_post_check_assertion_post_check_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_post_check_assertion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion" ADD CONSTRAINT "lessons_blocks_post_check_assertion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_sequence_steps_args" ADD CONSTRAINT "lessons_blocks_sequence_steps_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_sequence_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_sequence_steps" ADD CONSTRAINT "lessons_blocks_sequence_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_sequence"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_sequence_post_check_args" ADD CONSTRAINT "lessons_blocks_sequence_post_check_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_sequence"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_sequence" ADD CONSTRAINT "lessons_blocks_sequence_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_blocks_return_assertion_args_order_idx" ON "payload"."lessons_blocks_return_assertion_args" USING btree ("_order");
  CREATE INDEX "lessons_blocks_return_assertion_args_parent_id_idx" ON "payload"."lessons_blocks_return_assertion_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_return_assertion_order_idx" ON "payload"."lessons_blocks_return_assertion" USING btree ("_order");
  CREATE INDEX "lessons_blocks_return_assertion_parent_id_idx" ON "payload"."lessons_blocks_return_assertion" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_return_assertion_path_idx" ON "payload"."lessons_blocks_return_assertion" USING btree ("_path");
  CREATE INDEX "lessons_blocks_post_check_assertion_args_order_idx" ON "payload"."lessons_blocks_post_check_assertion_args" USING btree ("_order");
  CREATE INDEX "lessons_blocks_post_check_assertion_args_parent_id_idx" ON "payload"."lessons_blocks_post_check_assertion_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_post_check_assertion_post_check_args_order_idx" ON "payload"."lessons_blocks_post_check_assertion_post_check_args" USING btree ("_order");
  CREATE INDEX "lessons_blocks_post_check_assertion_post_check_args_parent_id_idx" ON "payload"."lessons_blocks_post_check_assertion_post_check_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_post_check_assertion_order_idx" ON "payload"."lessons_blocks_post_check_assertion" USING btree ("_order");
  CREATE INDEX "lessons_blocks_post_check_assertion_parent_id_idx" ON "payload"."lessons_blocks_post_check_assertion" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_post_check_assertion_path_idx" ON "payload"."lessons_blocks_post_check_assertion" USING btree ("_path");
  CREATE INDEX "lessons_blocks_sequence_steps_args_order_idx" ON "payload"."lessons_blocks_sequence_steps_args" USING btree ("_order");
  CREATE INDEX "lessons_blocks_sequence_steps_args_parent_id_idx" ON "payload"."lessons_blocks_sequence_steps_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_sequence_steps_order_idx" ON "payload"."lessons_blocks_sequence_steps" USING btree ("_order");
  CREATE INDEX "lessons_blocks_sequence_steps_parent_id_idx" ON "payload"."lessons_blocks_sequence_steps" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_sequence_post_check_args_order_idx" ON "payload"."lessons_blocks_sequence_post_check_args" USING btree ("_order");
  CREATE INDEX "lessons_blocks_sequence_post_check_args_parent_id_idx" ON "payload"."lessons_blocks_sequence_post_check_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_sequence_order_idx" ON "payload"."lessons_blocks_sequence" USING btree ("_order");
  CREATE INDEX "lessons_blocks_sequence_parent_id_idx" ON "payload"."lessons_blocks_sequence" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_sequence_path_idx" ON "payload"."lessons_blocks_sequence" USING btree ("_path");`)
}
