import { and, eq, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, payloadDb } from '../../db'
import { Lesson, payloadSchema } from '@redduck/payload-config'
import { userLessons } from '../../db/schema'

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
        reviewGradingTasks: true,
      },
    })

    if (!lesson) {
      throw new HTTPException(404, { message: 'Lesson not found' })
    }

    const next = await LessonsService.#getNextLessonSlug(courseSlug, lesson.id)

    // @ts-expect-error - next is not typed
    lesson.next = next

    if (lesson.type === 'review_task') {
      return LessonsService.#toPublicReviewLesson(lesson)
    }

    if (lesson.type === 'test') {
      if (!lesson.questions) return lesson

      return {
        ...lesson,
        questions: lesson.questions.map((q) => {
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

    return lesson
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
        reviewGradingTasks: true,
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
   * Strips AI-only rubric fields from review lessons so the public API does not leak hints or criteria.
   */
  static #toPublicReviewLesson<L extends Record<string, unknown>>(lesson: L) {
    const { aiTaskSummary: _a, aiPossibleSolutions: _b, reviewGradingTasks: _c, ...rest } = lesson
    return rest
  }
}
