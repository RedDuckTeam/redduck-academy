// Database schema
// Better-auth tables are defined in auth-schema.ts
import { pgTable, text, timestamp, integer, boolean, serial, jsonb } from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

export * from './auth-schema'

export const userLessons = pgTable('user_lessons', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').notNull(),
  score: integer('score'),
  userAnswers: jsonb('user_answers'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})
