DROP INDEX "user_certificates_user_id_course_slug_name_unique";--> statement-breakpoint
-- If a user previously claimed multiple certificates for the same course (one per rename),
-- keep the earliest by issued_at and drop the rest before adding the new unique index.
DELETE FROM "user_certificates" a
USING "user_certificates" b
WHERE a.user_id = b.user_id
  AND a.course_slug = b.course_slug
  AND a.issued_at > b.issued_at;--> statement-breakpoint
CREATE UNIQUE INDEX "user_certificates_user_id_course_slug_unique" ON "user_certificates" USING btree ("user_id","course_slug");
