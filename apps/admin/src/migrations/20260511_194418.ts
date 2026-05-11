import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."lessons_solidity_test_cases_steps_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_solidity_test_cases_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"function_name" varchar,
  	"value_wei" varchar,
  	"caller" varchar,
  	"expected" varchar
  );
  
  CREATE TABLE "payload"."lessons_solidity_test_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  DROP TABLE "payload"."lessons_blocks_case_steps_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_case_steps" CASCADE;
  DROP TABLE "payload"."lessons_blocks_case" CASCADE;
  ALTER TABLE "payload"."lessons_solidity_test_cases_steps_args" ADD CONSTRAINT "lessons_solidity_test_cases_steps_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_solidity_test_cases_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_solidity_test_cases_steps" ADD CONSTRAINT "lessons_solidity_test_cases_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_solidity_test_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_solidity_test_cases" ADD CONSTRAINT "lessons_solidity_test_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_solidity_test_cases_steps_args_order_idx" ON "payload"."lessons_solidity_test_cases_steps_args" USING btree ("_order");
  CREATE INDEX "lessons_solidity_test_cases_steps_args_parent_id_idx" ON "payload"."lessons_solidity_test_cases_steps_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_solidity_test_cases_steps_order_idx" ON "payload"."lessons_solidity_test_cases_steps" USING btree ("_order");
  CREATE INDEX "lessons_solidity_test_cases_steps_parent_id_idx" ON "payload"."lessons_solidity_test_cases_steps" USING btree ("_parent_id");
  CREATE INDEX "lessons_solidity_test_cases_order_idx" ON "payload"."lessons_solidity_test_cases" USING btree ("_order");
  CREATE INDEX "lessons_solidity_test_cases_parent_id_idx" ON "payload"."lessons_solidity_test_cases" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
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
  
  DROP TABLE "payload"."lessons_solidity_test_cases_steps_args" CASCADE;
  DROP TABLE "payload"."lessons_solidity_test_cases_steps" CASCADE;
  DROP TABLE "payload"."lessons_solidity_test_cases" CASCADE;
  ALTER TABLE "payload"."lessons_blocks_case_steps_args" ADD CONSTRAINT "lessons_blocks_case_steps_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_case_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_case_steps" ADD CONSTRAINT "lessons_blocks_case_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_case"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_case" ADD CONSTRAINT "lessons_blocks_case_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_blocks_case_steps_args_order_idx" ON "payload"."lessons_blocks_case_steps_args" USING btree ("_order");
  CREATE INDEX "lessons_blocks_case_steps_args_parent_id_idx" ON "payload"."lessons_blocks_case_steps_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_case_steps_order_idx" ON "payload"."lessons_blocks_case_steps" USING btree ("_order");
  CREATE INDEX "lessons_blocks_case_steps_parent_id_idx" ON "payload"."lessons_blocks_case_steps" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_case_order_idx" ON "payload"."lessons_blocks_case" USING btree ("_order");
  CREATE INDEX "lessons_blocks_case_parent_id_idx" ON "payload"."lessons_blocks_case" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_case_path_idx" ON "payload"."lessons_blocks_case" USING btree ("_path");`)
}
