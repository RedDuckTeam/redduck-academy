import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."lessons_executable_test_cases" ADD COLUMN "value_wei" varchar;
  ALTER TABLE "payload"."lessons_executable_test_cases" ADD COLUMN "post_check_json" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."lessons_executable_test_cases" DROP COLUMN "value_wei";
  ALTER TABLE "payload"."lessons_executable_test_cases" DROP COLUMN "post_check_json";`)
}
