import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."courses_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  ALTER TABLE "payload"."courses" ADD COLUMN "duration_hours" numeric;
  ALTER TABLE "payload"."courses_tags" ADD CONSTRAINT "courses_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."courses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_tags_order_idx" ON "payload"."courses_tags" USING btree ("_order");
  CREATE INDEX "courses_tags_parent_id_idx" ON "payload"."courses_tags" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."courses_tags" CASCADE;
  ALTER TABLE "payload"."courses" DROP COLUMN "duration_hours";`)
}
