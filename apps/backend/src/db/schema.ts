// Database schema
// Better-auth tables are defined in auth-schema.ts
import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  serial,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

export * from './auth-schema'

export const userLessons = pgTable(
  'user_lessons',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lessonId: integer('lesson_id').notNull(),
    score: integer('score'),
    userAnswers: jsonb('user_answers'),
    isCompleted: boolean('is_completed').default(false).notNull(),
    attemptsLeft: integer('attempts_left').default(3).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => ({
    userIdLessonIdUnique: uniqueIndex('user_lessons_user_id_lesson_id_unique').on(t.userId, t.lessonId),
  }),
)

export const projectUserSubmissions = pgTable(
  'project_user_submissions',
  {
    id: serial('id').primaryKey(),
    userLessonId: integer('user_lesson_id')
      .notNull()
      .references(() => userLessons.id, { onDelete: 'cascade' }),
    repoUrl: text('repo_url').notNull(),
    commitSha: text('commit_sha'),
    batchRequestId: text('batch_request_id'),
    status: text('status').notNull().default('pending'),
    feedback: jsonb('feedback'),
    errorMessage: text('error_message'),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (t) => ({
    userLessonIdIdx: index('project_user_submissions_user_lesson_id_idx').on(t.userLessonId),
    userLessonSubmittedIdx: index('project_user_submissions_user_lesson_submitted_idx').on(
      t.userLessonId,
      t.submittedAt,
    ),
  }),
)

export const codingTaskSubmissions = pgTable(
  'coding_task_submissions',
  {
    id: serial('id').primaryKey(),
    userLessonId: integer('user_lesson_id')
      .notNull()
      .references(() => userLessons.id, { onDelete: 'cascade' }),
    submittedCode: text('submitted_code').notNull(),
    language: text('language').notNull(),
    passed: boolean('passed').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  },
  (t) => ({
    userLessonIdIdx: index('coding_task_submissions_user_lesson_id_idx').on(t.userLessonId),
  }),
)

export const userLessonsRelations = relations(userLessons, ({ many }) => ({
  projectSubmissions: many(projectUserSubmissions),
  codingTaskSubmissions: many(codingTaskSubmissions),
}))

export const projectUserSubmissionsRelations = relations(projectUserSubmissions, ({ one }) => ({
  userLesson: one(userLessons, {
    fields: [projectUserSubmissions.userLessonId],
    references: [userLessons.id],
  }),
}))

export const codingTaskSubmissionsRelations = relations(codingTaskSubmissions, ({ one }) => ({
  userLesson: one(userLessons, {
    fields: [codingTaskSubmissions.userLessonId],
    references: [userLessons.id],
  }),
}))
