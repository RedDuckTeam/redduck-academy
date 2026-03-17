import { eq, and } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, payloadDb } from '../../db'
import { payloadSchema } from '@redduck/payload-config'
import { userLessons } from '../../db/schema'

const { courses, lessons, modules } = payloadSchema

export class LessonsService {
  static async getLesson(courseSlug: string, lessonSlug: string) {
    const candidates = await payloadDb.query.lessons.findMany({
      where: eq(lessons.slug, lessonSlug),
      with: {
        module: {
          with: {
            course: true,
          },
        },
        questions: {
          with: {
            options: true,
          },
        },
      },
    })

    const lesson = candidates.find((l) => l.module?.course?.slug === courseSlug)
    if (!lesson) {
      throw new HTTPException(404, { message: 'Lesson not found' })
    }

    const next = await LessonsService.#getNextLessonSlug(courseSlug, lesson.id)

    if (lesson.type !== 'test') return { ...lesson, next }

    return {
      ...lesson,
      next,
      questions: lesson.questions!.map((q) => {
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

    const [existing] = await db
      .select()
      .from(userLessons)
      .where(
        and(
          eq(userLessons.userId, userId),
          eq(userLessons.lessonId, lesson.id),
          eq(userLessons.isCompleted, true),
        ),
      )
      .limit(1)

    if (existing) return

    await db.insert(userLessons).values({
      userId,
      lessonId: lesson.id,
      isCompleted: true,
    })
  }

  static async #getLessonBySlugs(courseSlug: string, lessonSlug: string) {
    const candidates = await payloadDb.query.lessons.findMany({
      where: eq(lessons.slug, lessonSlug),
      with: {
        module: {
          with: {
            course: true,
          },
        },
      },
    })

    return candidates.find((l) => l.module?.course?.slug === courseSlug) ?? null
  }
}
