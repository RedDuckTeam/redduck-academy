import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."lessons_questions"
    ALTER COLUMN "question" SET DATA TYPE jsonb
    USING jsonb_build_object(
      'root', jsonb_build_object(
        'type', 'root',
        'format', '',
        'indent', 0,
        'version', 1,
        'direction', 'ltr',
        'children', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'format', '',
            'indent', 0,
            'version', 1,
            'direction', 'ltr',
            'textFormat', 0,
            'textStyle', '',
            'children', jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'format', 0,
                'mode', 'normal',
                'style', '',
                'text', COALESCE("question", ''),
                'detail', 0,
                'version', 1
              )
            )
          )
        )
      )
    );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."lessons_questions"
    ALTER COLUMN "question" SET DATA TYPE varchar
    USING COALESCE("question"->'root'->'children'->0->'children'->0->>'text', '');
  `)
}
