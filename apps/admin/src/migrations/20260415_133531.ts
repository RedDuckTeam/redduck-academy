import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."courses" ADD COLUMN "is_hidden" boolean DEFAULT false;
  ALTER TABLE "payload"."modules" ADD COLUMN "is_hidden" boolean DEFAULT false;
  ALTER TABLE "payload"."lessons" ADD COLUMN "is_hidden" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."courses" DROP COLUMN "is_hidden";
  ALTER TABLE "payload"."modules" DROP COLUMN "is_hidden";
  ALTER TABLE "payload"."lessons" DROP COLUMN "is_hidden";`)
}
