import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."lessons_questions" DROP COLUMN IF EXISTS "points";
    ALTER TABLE "payload"."lessons_review_grading_tasks" DROP COLUMN IF EXISTS "points";
    ALTER TABLE "payload"."lessons" DROP COLUMN IF EXISTS "max_points";
    ALTER TABLE "payload"."courses" ADD COLUMN IF NOT EXISTS "prerequisite_course_id" integer REFERENCES "payload"."courses"("id") ON DELETE set null;
    CREATE INDEX IF NOT EXISTS "courses_prerequisite_course_idx" ON "payload"."courses" ("prerequisite_course_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."lessons_questions" ADD COLUMN "points" numeric DEFAULT 5;
    ALTER TABLE "payload"."lessons_review_grading_tasks" ADD COLUMN "points" numeric;
    ALTER TABLE "payload"."lessons" ADD COLUMN "max_points" numeric DEFAULT 0;
    DROP INDEX IF EXISTS "payload"."courses_prerequisite_course_idx";
    ALTER TABLE "payload"."courses" DROP COLUMN IF EXISTS "prerequisite_course_id";
  `)
}
