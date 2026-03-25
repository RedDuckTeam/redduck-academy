import { relations } from 'drizzle-orm'
import * as g from './payload-generated-schema'

const { courses, modules, lessons, media } = g

export const relations_courses = relations(courses, ({ one, many }) => ({
  coverImage: one(media, {
    fields: [courses.coverImage],
    references: [media.id],
    relationName: 'coverImage',
  }),
  modules: many(modules, { relationName: 'course' }),
}))

export const relations_modules = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.course],
    references: [courses.id],
    relationName: 'course',
  }),
  lessons: many(lessons, { relationName: 'module' }),
}))

export {
  db_schema,
  enum_lessons_type,
  users_sessions,
  users,
  media,
  courses,
  modules,
  lessons_questions_options,
  lessons_questions,
  lessons_review_grading_tasks,
  lessons_review_paths,
  lessons,
  payload_kv,
  payload_locked_documents,
  payload_locked_documents_rels,
  payload_preferences,
  payload_preferences_rels,
  payload_migrations,
  relations_users_sessions,
  relations_users,
  relations_media,
  relations_lessons_questions_options,
  relations_lessons_questions,
  relations_lessons_review_grading_tasks,
  relations_lessons_review_paths,
  relations_lessons,
  relations_payload_kv,
  relations_payload_locked_documents_rels,
  relations_payload_locked_documents,
  relations_payload_preferences_rels,
  relations_payload_preferences,
  relations_payload_migrations,
} from './payload-generated-schema'
