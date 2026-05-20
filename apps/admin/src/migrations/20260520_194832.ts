import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."lessons_executable_test_cases" ADD COLUMN "name" varchar;
  ALTER TABLE "payload"."lessons_solidity_test_cases_steps" ADD COLUMN "name" varchar;
  ALTER TABLE "payload"."lessons_solidity_test_cases" ADD COLUMN "name" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."lessons_executable_test_cases" DROP COLUMN "name";
  ALTER TABLE "payload"."lessons_solidity_test_cases_steps" DROP COLUMN "name";
  ALTER TABLE "payload"."lessons_solidity_test_cases" DROP COLUMN "name";`)
}
