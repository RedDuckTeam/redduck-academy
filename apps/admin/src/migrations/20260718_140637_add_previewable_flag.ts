import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."courses" ADD COLUMN "previewable" boolean DEFAULT false;
  ALTER TABLE "payload"."modules" ADD COLUMN "previewable" boolean DEFAULT false;
  ALTER TABLE "payload"."lessons" ADD COLUMN "previewable" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."courses" DROP COLUMN "previewable";
  ALTER TABLE "payload"."modules" DROP COLUMN "previewable";
  ALTER TABLE "payload"."lessons" DROP COLUMN "previewable";`)
}
