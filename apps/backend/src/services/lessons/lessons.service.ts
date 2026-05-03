import { and, eq, ne, sql } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { AppError } from '../../lib/errors'
import { Lesson, payloadSchema } from '@redduck/payload-config'
import { userLessons } from '../../db/schema'
import { enrichLessonContentInternalLinks } from './lesson-link-resolution'

const { courses, lessons, modules } = payloadSchema

export class LessonsService {
  static async getLesson(courseSlug: string, lessonSlug: string) {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: and(
        eq(lessons.slug, lessonSlug),
        ne(lessons.isHidden, true),
        sql`exists (
          select 1 from ${modules} m
          inner join ${courses} c on c.id = m.course_id
          where m.id = ${lessons.module}
            and c.slug = ${courseSlug}
            and coalesce(c.is_hidden, false) = false
            and coalesce(m.is_hidden, false) = false
        )`,
      ),
      with: {
        module: { with: { course: true } },
        questions: { with: { options: true } },
        reviewGradingTasks: {
          orderBy: (tasks, { asc }) => [asc(tasks._order)],
        },
        codingTestCases: true,
        executableTestCases: {
          orderBy: (cases, { asc }) => [asc(cases._order)],
        },
        solidityConstructorArgs: {
          orderBy: (cols, { asc }) => [asc(cols._order)],
          with: {},
        },
        _blocks_returnAssertion: {
          orderBy: (cols, { asc }) => [asc(cols._order)],
          with: { args: { orderBy: (a, { asc }) => [asc(a._order)] } },
        },
        _blocks_postCheckAssertion: {
          orderBy: (cols, { asc }) => [asc(cols._order)],
          with: {
            args: { orderBy: (a, { asc }) => [asc(a._order)] },
            postCheckArgs: { orderBy: (a, { asc }) => [asc(a._order)] },
          },
        },
      },
    })

    if (!lesson) {
      throw new AppError(404, 'Lesson not found')
    }

    const next = await LessonsService.#getNextLessonSlug(courseSlug, lesson.id)

    const content = lesson.content != null ? await enrichLessonContentInternalLinks(lesson.content) : lesson.content
    const lessonWithNext = LessonsService.#mergeSolidityBlocks({ ...lesson, next, content })

    if (lessonWithNext.type === 'review_task') {
      return LessonsService.#toPublicReviewLesson(lessonWithNext)
    }

    if (lessonWithNext.type === 'coding_task') {
      return LessonsService.#toPublicCodingLesson(lessonWithNext)
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
   * Server-only: coding task lesson with AI fields for the given course.
   */
  static async getCodingTaskLesson(courseSlug: string, lessonSlug: string): Promise<Lesson> {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: and(
        eq(lessons.slug, lessonSlug),
        ne(lessons.isHidden, true),
        sql`exists (
          select 1 from ${modules} m
          inner join ${courses} c on c.id = m.course_id
          where m.id = ${lessons.module}
            and c.slug = ${courseSlug}
            and coalesce(c.is_hidden, false) = false
            and coalesce(m.is_hidden, false) = false
        )`,
      ),
      with: {
        codingTestCases: true,
        executableTestCases: {
          orderBy: (cases, { asc }) => [asc(cases._order)],
        },
        solidityConstructorArgs: {
          orderBy: (cols, { asc }) => [asc(cols._order)],
        },
        _blocks_returnAssertion: {
          orderBy: (cols, { asc }) => [asc(cols._order)],
          with: { args: { orderBy: (a, { asc }) => [asc(a._order)] } },
        },
        _blocks_postCheckAssertion: {
          orderBy: (cols, { asc }) => [asc(cols._order)],
          with: {
            args: { orderBy: (a, { asc }) => [asc(a._order)] },
            postCheckArgs: { orderBy: (a, { asc }) => [asc(a._order)] },
          },
        },
      },
    })

    if (!lesson) {
      throw new AppError(404, 'Lesson not found')
    }
    if (lesson.type !== 'coding_task') {
      throw new AppError(400, 'Lesson is not a coding task')
    }

    return LessonsService.#mergeSolidityBlocks(lesson) as unknown as Lesson
  }

  /**
   * Drizzle returns each Payload block type as its own relation array. The wire shape
   * expected by FE/AI prompt is a single discriminated `solidityTestCases` array
   * ordered by `_order` across both block types. Walk both arrays, slap a `blockType`
   * onto each row, and sort.
   */
  static #mergeSolidityBlocks<L extends Record<string, unknown>>(lesson: L): L & { solidityTestCases: unknown[] } {
    const ret = (lesson as { _blocks_returnAssertion?: unknown[] })._blocks_returnAssertion ?? []
    const post = (lesson as { _blocks_postCheckAssertion?: unknown[] })._blocks_postCheckAssertion ?? []
    const tagged: Array<{ _order: number } & Record<string, unknown>> = []
    for (const row of ret) {
      const r = row as Record<string, unknown>
      tagged.push({ ...(r as { _order: number } & Record<string, unknown>), blockType: 'returnAssertion' })
    }
    for (const row of post) {
      const r = row as Record<string, unknown>
      tagged.push({ ...(r as { _order: number } & Record<string, unknown>), blockType: 'postCheckAssertion' })
    }
    tagged.sort((a, b) => Number(a._order ?? 0) - Number(b._order ?? 0))
    const merged = { ...lesson, solidityTestCases: tagged } as L & { solidityTestCases: unknown[] }
    delete (merged as Record<string, unknown>)._blocks_returnAssertion
    delete (merged as Record<string, unknown>)._blocks_postCheckAssertion
    return merged
  }

  /**
   * Server-only: review lesson + rubric for the given course (one query: lesson scoped by course slug).
   */
  static async getReviewLessonWithRubric(courseSlug: string, lessonSlug: string): Promise<Lesson> {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: and(
        eq(lessons.slug, lessonSlug),
        ne(lessons.isHidden, true),
        sql`exists (
          select 1 from ${modules} m
          inner join ${courses} c on c.id = m.course_id
          where m.id = ${lessons.module}
            and c.slug = ${courseSlug}
            and coalesce(c.is_hidden, false) = false
            and coalesce(m.is_hidden, false) = false
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
      throw new AppError(404, 'Lesson not found')
    }
    if (lesson.type !== 'review_task') {
      throw new AppError(400, 'Lesson is not a review task')
    }

    return lesson as Lesson
  }

  static async #getNextLessonSlug(courseSlug: string, lessonId: number): Promise<string | null> {
    const course = await payloadDb.query.courses.findFirst({
      where: (c, { and }) => and(eq(c.slug, courseSlug), ne(c.isHidden, true)),
      with: {
        modules: {
          where: (m) => ne(m.isHidden, true),
          orderBy: (modules, { asc }) => [asc(modules.order)],
          columns: { id: true, order: true },
          with: {
            lessons: {
              where: (l) => ne(l.isHidden, true),
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
        ne(lessons.isHidden, true),
        sql`exists (
          select 1 from ${modules} m
          inner join ${courses} c on c.id = m.course_id
          where m.id = ${lessons.module}
            and c.slug = ${courseSlug}
            and coalesce(c.is_hidden, false) = false
            and coalesce(m.is_hidden, false) = false
        )`,
      ),
    })

    return lesson || null
  }

  /**
   * Strips AI-only fields from a coding_task lesson. Returns starterCode, codingLanguage, codingTestCases as-is.
   */
  static #toPublicCodingLesson<L extends Record<string, unknown>>(lesson: L) {
    const { aiExpectedResult: _a, ...rest } = lesson
    return rest
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
