-- Add sequences for Payload auto-increment IDs (courses, modules, lessons)
CREATE SEQUENCE IF NOT EXISTS "payload"."courses_id_seq";
ALTER TABLE "payload"."courses" ALTER COLUMN "id" SET DEFAULT nextval('"payload"."courses_id_seq"');
SELECT setval('"payload"."courses_id_seq"', COALESCE((SELECT MAX("id") FROM "payload"."courses"), 0) + 1);
ALTER SEQUENCE "payload"."courses_id_seq" OWNED BY "payload"."courses"."id";
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "payload"."modules_id_seq";
ALTER TABLE "payload"."modules" ALTER COLUMN "id" SET DEFAULT nextval('"payload"."modules_id_seq"');
SELECT setval('"payload"."modules_id_seq"', COALESCE((SELECT MAX("id") FROM "payload"."modules"), 0) + 1);
ALTER SEQUENCE "payload"."modules_id_seq" OWNED BY "payload"."modules"."id";
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "payload"."lessons_id_seq";
ALTER TABLE "payload"."lessons" ALTER COLUMN "id" SET DEFAULT nextval('"payload"."lessons_id_seq"');
SELECT setval('"payload"."lessons_id_seq"', COALESCE((SELECT MAX("id") FROM "payload"."lessons"), 0) + 1);
ALTER SEQUENCE "payload"."lessons_id_seq" OWNED BY "payload"."lessons"."id";
