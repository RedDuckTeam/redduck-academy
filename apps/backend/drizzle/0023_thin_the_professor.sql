ALTER TABLE "user_certificates" ADD COLUMN "human_id" text;--> statement-breakpoint
DO $$
DECLARE
  cert_id uuid;
  new_human_id text;
  attempts int;
BEGIN
  FOR cert_id IN SELECT id FROM "user_certificates" WHERE human_id IS NULL LOOP
    attempts := 0;
    LOOP
      new_human_id := 'RD-' || (
        SELECT string_agg(
          substring('0123456789ABCDEFGHJKMNPQRSTVWXYZ' FROM floor(random() * 32)::int + 1 FOR 1),
          ''
        )
        FROM generate_series(1, 8)
      );
      IF NOT EXISTS (SELECT 1 FROM "user_certificates" WHERE human_id = new_human_id) THEN
        UPDATE "user_certificates" SET human_id = new_human_id WHERE id = cert_id;
        EXIT;
      END IF;
      attempts := attempts + 1;
      IF attempts > 20 THEN
        RAISE EXCEPTION 'Failed to generate unique human_id after % attempts', attempts;
      END IF;
    END LOOP;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "user_certificates" ALTER COLUMN "human_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_certificates_human_id_unique" ON "user_certificates" USING btree ("human_id");
