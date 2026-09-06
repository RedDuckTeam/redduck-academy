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
  numeric,
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
    humanId: text('human_id').notNull(),
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
    userCourseUnique: uniqueIndex('user_certificates_user_id_course_slug_unique').on(t.userId, t.courseSlug),
    humanIdUnique: uniqueIndex('user_certificates_human_id_unique').on(t.humanId),
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

/**
 * Append-only log of every LLM API call made for reviews. One row per call.
 * `userId` / `lessonId` are denormalized so per-user and per-lesson rollups stay fast
 * and survive deletion of the source submission. Cost is forward-only: rows only exist
 * from the day capture shipped (past calls didn't record `usage`).
 * `costUsd` is derived from raw tokens via the pricing map; `pricingVersion` records which
 * map produced it so cost can be recomputed from tokens if rates were wrong.
 */
export const aiUsageLogs = pgTable(
  'ai_usage_logs',
  {
    id: serial('id').primaryKey(),
    // set null (not cascade): keep cost in account-wide totals even if the user is deleted.
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    lessonId: integer('lesson_id'),
    userLessonId: integer('user_lesson_id').references(() => userLessons.id, { onDelete: 'set null' }),
    // 'project' | 'coding_task' | 'coding_task_recheck'
    submissionType: text('submission_type').notNull(),
    // id within the matching submission table (polymorphic, so no FK). Nullable.
    submissionId: integer('submission_id'),
    model: text('model').notNull(),
    isBatch: boolean('is_batch').notNull().default(false),
    promptTokens: integer('prompt_tokens').notNull().default(0),
    cachedTokens: integer('cached_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),
    // microdollar precision; tiny per-call costs need the scale.
    costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
    pricingVersion: text('pricing_version').notNull(),
    batchRequestId: text('batch_request_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    userCreatedIdx: index('ai_usage_logs_user_created_idx').on(t.userId, t.createdAt),
    lessonIdx: index('ai_usage_logs_lesson_idx').on(t.lessonId),
    createdIdx: index('ai_usage_logs_created_idx').on(t.createdAt),
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

/**
 * One row per lesson-edit proposal opened from the in-browser editor.
 *
 * Deliberately thin: who proposed the change, why, and under which licence notice all live in the
 * commit trailer and the pull-request body, which are the durable public record. This table is a
 * quota counter and a pointer back to that record, so the free-text a contributor typed is not
 * duplicated into a store nobody reads.
 */
export const contentProposals = pgTable(
  'content_proposals',
  {
    /** Random UUID rather than a serial: proposals must not be enumerable. */
    id: text('id').primaryKey(),
    /** Repo-relative path written, e.g. `content/<course>/<module>/<lesson>.md`. */
    path: text('path').notNull(),
    branch: text('branch').notNull(),
    /**
     * Null between reserving the quota slot and the pull request existing. The row is written
     * before any GitHub call so that concurrent submissions contend for the slot in the database
     * rather than all reading a count of zero and racing past every limit.
     */
    prNumber: integer('pr_number'),
    door: text('door', { enum: ['anonymous', 'signed_in'] }).notNull(),
    /** HMAC of the contributor's IP prefix; anonymous door only. */
    ipHash: text('ip_hash'),
    privyUserId: text('privy_user_id'),
    licenseVersion: text('license_version').notNull(),
    licenseAcceptedAt: timestamp('license_accepted_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    // Every quota is "how many rows share this key inside a time window", so each index leads with
    // the key and ends with the timestamp.
    ipWindowIdx: index('content_proposals_ip_window_idx').on(t.ipHash, t.createdAt),
    userWindowIdx: index('content_proposals_user_window_idx').on(t.privyUserId, t.createdAt),
    pathWindowIdx: index('content_proposals_path_window_idx').on(t.path, t.createdAt),
    createdAtIdx: index('content_proposals_created_at_idx').on(t.createdAt),
  }),
)
