import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."lessons_executable_test_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"input_json" varchar,
  	"expected_json" varchar
  );
  
  ALTER TABLE "payload"."lessons" ADD COLUMN "function_signature" varchar;
  ALTER TABLE "payload"."lessons" ADD COLUMN "solidity_contract_name" varchar;
  ALTER TABLE "payload"."lessons" ADD COLUMN "solidity_constructor_args" varchar;
  ALTER TABLE "payload"."lessons_executable_test_cases" ADD CONSTRAINT "lessons_executable_test_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_executable_test_cases_order_idx" ON "payload"."lessons_executable_test_cases" USING btree ("_order");
  CREATE INDEX "lessons_executable_test_cases_parent_id_idx" ON "payload"."lessons_executable_test_cases" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."lessons_executable_test_cases" CASCADE;
  ALTER TABLE "payload"."lessons" DROP COLUMN "function_signature";
  ALTER TABLE "payload"."lessons" DROP COLUMN "solidity_contract_name";
  ALTER TABLE "payload"."lessons" DROP COLUMN "solidity_constructor_args";`)
}
