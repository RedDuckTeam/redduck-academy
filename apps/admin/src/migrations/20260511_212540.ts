import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."lessons_solidity_fixtures_constructor_args" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."lessons_solidity_fixtures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"alias" varchar,
  	"source" varchar,
  	"contract_name" varchar
  );
  
  ALTER TABLE "payload"."lessons_solidity_test_cases_steps" ADD COLUMN "target" varchar;
  ALTER TABLE "payload"."lessons_solidity_fixtures_constructor_args" ADD CONSTRAINT "lessons_solidity_fixtures_constructor_args_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons_solidity_fixtures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lessons_solidity_fixtures" ADD CONSTRAINT "lessons_solidity_fixtures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_solidity_fixtures_constructor_args_order_idx" ON "payload"."lessons_solidity_fixtures_constructor_args" USING btree ("_order");
  CREATE INDEX "lessons_solidity_fixtures_constructor_args_parent_id_idx" ON "payload"."lessons_solidity_fixtures_constructor_args" USING btree ("_parent_id");
  CREATE INDEX "lessons_solidity_fixtures_order_idx" ON "payload"."lessons_solidity_fixtures" USING btree ("_order");
  CREATE INDEX "lessons_solidity_fixtures_parent_id_idx" ON "payload"."lessons_solidity_fixtures" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."lessons_solidity_fixtures_constructor_args" CASCADE;
  DROP TABLE "payload"."lessons_solidity_fixtures" CASCADE;
  ALTER TABLE "payload"."lessons_solidity_test_cases_steps" DROP COLUMN "target";`)
}
