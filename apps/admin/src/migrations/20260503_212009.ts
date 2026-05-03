import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."lessons_solidity_constructor_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
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
  	"post_check_function_name" varchar,
  	"expected" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "payload"."lessons_solidity_constructor_args" ADD CONSTRAINT "lessons_solidity_constructor_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_return_assertion_args" ADD CONSTRAINT "lessons_blocks_return_assertion_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_return_assertion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_return_assertion" ADD CONSTRAINT "lessons_blocks_return_assertion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion_args" ADD CONSTRAINT "lessons_blocks_post_check_assertion_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_post_check_assertion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion_post_check_args" ADD CONSTRAINT "lessons_blocks_post_check_assertion_post_check_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_blocks_post_check_assertion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion" ADD CONSTRAINT "lessons_blocks_post_check_assertion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_solidity_constructor_args_order_idx" ON "payload"."lessons_solidity_constructor_args" USING btree ("_order");
  CREATE INDEX "lessons_solidity_constructor_args_parent_id_idx" ON "payload"."lessons_solidity_constructor_args" USING btree ("_parent_id");
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
  ALTER TABLE "payload"."lessons_executable_test_cases" DROP COLUMN "value_wei";
  ALTER TABLE "payload"."lessons_executable_test_cases" DROP COLUMN "post_check_json";
  ALTER TABLE "payload"."lessons" DROP COLUMN "solidity_constructor_args";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."lessons_solidity_constructor_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_return_assertion_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_return_assertion" CASCADE;
  DROP TABLE "payload"."lessons_blocks_post_check_assertion_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_post_check_assertion_post_check_args" CASCADE;
  DROP TABLE "payload"."lessons_blocks_post_check_assertion" CASCADE;
  ALTER TABLE "payload"."lessons_executable_test_cases" ADD COLUMN "value_wei" varchar;
  ALTER TABLE "payload"."lessons_executable_test_cases" ADD COLUMN "post_check_json" varchar;
  ALTER TABLE "payload"."lessons" ADD COLUMN "solidity_constructor_args" varchar;`)
}
