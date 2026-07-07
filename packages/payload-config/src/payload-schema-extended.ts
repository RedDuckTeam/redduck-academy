import { relations } from 'drizzle-orm'
import * as g from './payload-generated-schema'

const { courses, modules, lessons, media } = g

export const relations_courses = relations(courses, ({ one, many }) => ({
  coverImage: one(media, {
    fields: [courses.coverImage],
    references: [media.id],
    relationName: 'coverImage',
  }),
  prerequisiteCourse: one(courses, {
    fields: [courses.prerequisiteCourse],
    references: [courses.id],
    relationName: 'prerequisiteCourse',
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
  lessons_faq,
  lessons,
  community_events,
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
  relations_lessons_faq,
  relations_lessons,
  relations_community_events,
  relations_payload_kv,
  relations_payload_locked_documents_rels,
  relations_payload_locked_documents,
  relations_payload_preferences_rels,
  relations_payload_preferences,
  relations_payload_migrations,
  lessons_executable_test_cases,
  relations_lessons_executable_test_cases,
  lessons_solidity_constructor_args,
  relations_lessons_solidity_constructor_args,
  lessons_solidity_test_cases,
  relations_lessons_solidity_test_cases,
  lessons_solidity_test_cases_steps,
  relations_lessons_solidity_test_cases_steps,
  lessons_solidity_test_cases_steps_args,
  relations_lessons_solidity_test_cases_steps_args,
  lessons_solidity_fixtures,
  relations_lessons_solidity_fixtures,
  lessons_solidity_fixtures_constructor_args,
  relations_lessons_solidity_fixtures_constructor_args,
  enum_lessons_coding_language,
} from './payload-generated-schema'
