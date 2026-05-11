import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."lessons_blocks_return_assertion" ADD COLUMN "caller" varchar;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion" ADD COLUMN "caller" varchar;
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion" ADD COLUMN "post_check_caller" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."lessons_blocks_return_assertion" DROP COLUMN "caller";
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion" DROP COLUMN "caller";
  ALTER TABLE "payload"."lessons_blocks_post_check_assertion" DROP COLUMN "post_check_caller";`)
}
