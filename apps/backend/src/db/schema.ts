// Database schema
// Better-auth tables are defined in auth-schema.ts
import { relations, sql } from 'drizzle-orm'
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
  uuid,
  check,
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
    userAnswers: jsonb('user_answers'),
    isCompleted: boolean('is_completed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => ({
    userIdLessonIdUnique: uniqueIndex('user_lessons_user_id_lesson_id_unique').on(t.userId, t.lessonId),
    userCompletedIdx: index('user_lessons_user_completed_idx')
      .on(t.userId)
      .where(sql`${t.isCompleted} = true`),
    userAnswersSizeCheck: check(
      'user_lessons_user_answers_size_check',
      sql`${t.userAnswers} IS NULL OR pg_column_size(${t.userAnswers}) < 32768`,
    ),
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
    // Admin-only: short AI-generated note about the submission. Never returned to the learner.
    aiComment: text('ai_comment'),
    // Internal-only: used for cross-account rate-limit enforcement. Never exposed to the client.
    ipAddress: text('ip_address'),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  },
  (t) => ({
    userLessonIdIdx: index('coding_task_submissions_user_lesson_id_idx').on(t.userLessonId),
    userLessonSubmittedAtIdx: index('coding_task_submissions_user_lesson_submitted_at_idx').on(
      t.userLessonId,
      t.submittedAt,
    ),
    ipSubmittedAtIdx: index('coding_task_submissions_ip_submitted_at_idx').on(t.ipAddress, t.submittedAt),
  }),
)

export const userCertificates = pgTable(
  'user_certificates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    courseSlug: text('course_slug').notNull(),
    issuedAt: timestamp('issued_at').defaultNow().notNull(),
    name: text('name').notNull(),
    status: text('status', { enum: ['created', 'requested', 'claimed'] })
      .notNull()
      .default('created'),
    metadataUri: text('metadata_uri'),
    imageUrl: text('image_url'),
    tokenId: text('token_id'),
    txHash: text('tx_hash'),
    walletAddress: text('wallet_address'),
  },
  (t) => ({
    userCourseNameUnique: uniqueIndex('user_certificates_user_id_course_slug_name_unique').on(
      t.userId,
      t.courseSlug,
      t.name,
    ),
    statusIssuedAtIdx: index('user_certificates_status_issued_at_idx').on(t.status, t.issuedAt.desc()),
    txHashUnique: uniqueIndex('user_certificates_tx_hash_unique')
      .on(t.txHash)
      .where(sql`${t.txHash} IS NOT NULL`),
  }),
)

export const userCertificatesRelations = relations(userCertificates, ({ one }) => ({
  user: one(user, {
    fields: [userCertificates.userId],
    references: [user.id],
  }),
}))

export const codingTaskReviewCache = pgTable(
  'coding_task_review_cache',
  {
    id: serial('id').primaryKey(),
    lessonId: integer('lesson_id').notNull(),
    codeHash: text('code_hash').notNull(),
    passed: boolean('passed').notNull(),
    aiComment: text('ai_comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    lessonCodeHashUnique: uniqueIndex('coding_task_review_cache_lesson_id_code_hash_unique').on(
      t.lessonId,
      t.codeHash,
    ),
  }),
)

export const submissionRateLimits = pgTable(
  'submission_rate_limits',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    ipAddress: text('ip_address').notNull(),
    lessonId: integer('lesson_id').notNull(),
    attemptsUsed: integer('attempts_used').default(1).notNull(),
    windowStart: timestamp('window_start').defaultNow().notNull(),
    windowDurationHours: integer('window_duration_hours').default(1).notNull(),
    exhaustCount: integer('exhaust_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => ({
    ipLessonIdx: index('submission_rate_limits_ip_lesson_idx').on(t.ipAddress, t.lessonId),
    userLessonIdx: index('submission_rate_limits_user_lesson_idx').on(t.userId, t.lessonId),
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
