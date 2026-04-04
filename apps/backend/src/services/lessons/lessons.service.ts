import { and, eq, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, payloadDb } from '../../db'
import { Lesson, payloadSchema } from '@redduck/payload-config'
import { userLessons } from '../../db/schema'
import { enrichLessonContentInternalLinks } from './lesson-link-resolution'

const { courses, lessons, modules } = payloadSchema

export class LessonsService {
  static async getLesson(courseSlug: string, lessonSlug: string) {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: and(
        eq(lessons.slug, lessonSlug),
        sql`exists (
          select 1 from ${modules} m
          inner join ${courses} c on c.id = m.course_id
          where m.id = ${lessons.module} and c.slug = ${courseSlug}
        )`,
      ),
      with: {
        module: { with: { course: true } },
        questions: { with: { options: true } },
        reviewGradingTasks: {
          orderBy: (tasks, { asc }) => [asc(tasks._order)],
        },
      },
    })

    if (!lesson) {
      throw new HTTPException(404, { message: 'Lesson not found' })
    }

    const next = await LessonsService.#getNextLessonSlug(courseSlug, lesson.id)

    const content = lesson.content != null ? await enrichLessonContentInternalLinks(lesson.content) : lesson.content
    const lessonWithNext = { ...lesson, next, content }

    if (lessonWithNext.type === 'review_task') {
      return LessonsService.#toPublicReviewLesson(lessonWithNext)
    }

    if (lessonWithNext.type === 'test') {
      if (!lessonWithNext.questions) return lessonWithNext

      return {
        ...lessonWithNext,
        questions: lessonWithNext.questions.map((q) => {
          const correctCount = q.options?.filter((o) => o.isCorrect).length ?? 0
          return {
            ...q,
            isMultipleChoices: correctCount > 1,
            order: q._order,
            options: (q.options ?? []).map(({ isCorrect, ...safeOption }) => safeOption),
          }
        }),
      }
    }

    return lessonWithNext
  }

  /**
   * Server-only: review lesson + rubric for the given course (one query: lesson scoped by course slug).
   */
  static async getReviewLessonWithRubric(courseSlug: string, lessonSlug: string): Promise<Lesson> {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: and(
        eq(lessons.slug, lessonSlug),
        sql`exists (
          select 1 from ${modules} m
          inner join ${courses} c on c.id = m.course_id
          where m.id = ${lessons.module} and c.slug = ${courseSlug}
        )`,
      ),
      with: {
        reviewGradingTasks: {
          orderBy: (tasks, { asc }) => [asc(tasks._order)],
        },
        reviewPaths: {
          orderBy: (reviewPaths, { asc }) => [asc(reviewPaths._order)],
        },
      },
    })

    if (!lesson) {
      throw new HTTPException(404, { message: 'Lesson not found' })
    }
    if (lesson.type !== 'review_task') {
      throw new HTTPException(400, { message: 'Lesson is not a review task' })
    }

    return lesson as Lesson
  }

  static async #getNextLessonSlug(courseSlug: string, lessonId: number): Promise<string | null> {
    const course = await payloadDb.query.courses.findFirst({
      where: eq(courses.slug, courseSlug),
      with: {
        modules: {
          orderBy: (modules, { asc }) => [asc(modules.order)],
          columns: { id: true, order: true },
          with: {
            lessons: {
              orderBy: (lessons, { asc }) => [asc(lessons.order)],
              columns: { id: true, slug: true },
            },
          },
        },
      },
    })

    const orderedLessons = (course?.modules ?? []).flatMap((m) => m.lessons ?? [])
    const idx = orderedLessons.findIndex((l) => l.id === lessonId)
    return orderedLessons[idx + 1]?.slug ?? null
  }

  static async markLessonAsCompleted(userId: string, courseSlug: string, lessonSlug: string) {
    const lesson = await LessonsService.#getLessonBySlugs(courseSlug, lessonSlug)
    if (!lesson) return

    await db
      .insert(userLessons)
      .values({
        userId,
        lessonId: lesson.id,
        isCompleted: true,
      })
      .onConflictDoUpdate({
        target: [userLessons.userId, userLessons.lessonId],
        set: { isCompleted: true },
      })
  }

  static async #getLessonBySlugs(courseSlug: string, lessonSlug: string) {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: and(
        eq(lessons.slug, lessonSlug),
        sql`exists (
          select 1 from ${modules} m
          inner join ${courses} c on c.id = m.course_id
          where m.id = ${lessons.module} and c.slug = ${courseSlug}
        )`,
      ),
    })

    return lesson || null
  }

  /**
   * Strips AI-only lesson fields and maps grading tasks to a learner-safe shape (criteria optional; criteriaHidden when withheld).
   */
  static #toPublicReviewLesson<L extends Record<string, unknown>>(lesson: L) {
    const { aiTaskSummary: _a, aiPossibleSolutions: _b, reviewGradingTasks: tasks, ...rest } = lesson
    const publicTasks = Array.isArray(tasks)
      ? [...tasks]
          .sort((x, y) => Number((x as { _order?: unknown })._order) - Number((y as { _order?: unknown })._order))
          .map((row) => LessonsService.#mapReviewGradingTaskForPublic(row as Record<string, unknown>))
      : []
    return { ...rest, reviewGradingTasks: publicTasks }
  }

  static #mapReviewGradingTaskForPublic(row: Record<string, unknown>) {
    const hide = Boolean(row.hideCriteriaFromLearner)
    const criteriaRaw = row.criteria != null ? String(row.criteria).trim() : ''
    const base = {
      id: String(row.id),
      title: row.title != null ? String(row.title) : '',
      points: Number(row.points),
      isRequired: Boolean(row.isRequired),
      _order: Number(row._order),
      criteriaHidden: hide,
    }
    if (hide) {
      return base
    }
    if (criteriaRaw !== '') {
      return { ...base, criteria: criteriaRaw }
    }
    return base
  }
}
