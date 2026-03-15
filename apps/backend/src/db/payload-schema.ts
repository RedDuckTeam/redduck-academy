import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgSchema,
  boolean,
} from 'drizzle-orm/pg-core'

export const payloadSchema = pgSchema('payload')

export const courses = payloadSchema.table('courses', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  coverImageId: integer('cover_image_id'),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
})

export const modules = payloadSchema.table('modules', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'set null' }),
  order: integer('order').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
})

export const lessons = payloadSchema.table('lessons', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  moduleId: integer('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'set null' }),
  order: integer('order').notNull(),
  type: text('type').notNull(), // 'lecture' | 'test' | 'coding_task' | 'review_task'
  content: jsonb('content'),
  maxPoints: integer('max_points').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
})

export const lessonsQuestions = payloadSchema.table('lessons_questions', {
  id: text('id').primaryKey(),
  order: integer('_order').notNull(),
  parentId: integer('_parent_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  points: integer('points').notNull().default(5),
})

export const lessonsQuestionsOptions = payloadSchema.table('lessons_questions_options', {
  id: text('id').primaryKey(),
  order: integer('_order').notNull(),
  parentId: text('_parent_id')
    .notNull()
    .references(() => lessonsQuestions.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  isCorrect: boolean('is_correct').default(false),
})

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
}))

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}))

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  questions: many(lessonsQuestions),
}))

export const lessonsQuestionsRelations = relations(lessonsQuestions, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [lessonsQuestions.parentId],
    references: [lessons.id],
  }),
  options: many(lessonsQuestionsOptions),
}))

export const lessonsQuestionsOptionsRelations = relations(lessonsQuestionsOptions, ({ one }) => ({
  question: one(lessonsQuestions, {
    fields: [lessonsQuestionsOptions.parentId],
    references: [lessonsQuestions.id],
  }),
}))
