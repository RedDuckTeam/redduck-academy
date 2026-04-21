DROP INDEX "user_certificates_user_id_course_slug_unique";--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "status" text DEFAULT 'created' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "metadata_uri" text;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "token_id" text;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "tx_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "user_certificates_user_id_course_slug_name_unique" ON "user_certificates" USING btree ("user_id","course_slug","name");