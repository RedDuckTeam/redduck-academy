import { asc, eq } from 'drizzle-orm'
import { payloadDb } from '../../db'
import { AppError } from '../../lib/errors'
import { payloadSchema } from '@redduck/payload-config'

const { courses, lessons, modules } = payloadSchema

export class CoursesService {
  static async getCourseBySlug(slug: string) {
    const result = await payloadDb.query.courses.findFirst({
      where: eq(courses.slug, slug),
      with: {
        modules: {
          with: {
            lessons: true,
          },
        },
      },
    })
    if (!result) {
      throw new AppError(404, 'Course not found')
    }
    return result
  }

  static async listCourses() {
    return payloadDb.query.courses.findMany({
      orderBy: (c, { asc }) => [asc(c.order)],
      with: {
        modules: {
          with: {
            lessons: {
              columns: {
                id: true,
                title: true,
                slug: true,
                module: true,
                order: true,
                type: true,
                maxPoints: true,
                updatedAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })
  }

  static async listCoursesInfo() {
    const allCourses = await payloadDb.query.courses.findMany({
      orderBy: (c, { asc }) => [asc(c.order)],
      with: {
        modules: {
          with: {
            lessons: {
              with: {
                questions: true,
              },
            },
          },
        },
      },
    })

    return allCourses.map((course) => {
      const courseLessons = (course.modules ?? []).flatMap((m) => m.lessons ?? [])
      const totalTasks = courseLessons.filter((l) => l.type !== 'lecture').length
      const totalPoints = courseLessons.reduce((sum, lesson) => {
        if (lesson.type === 'lecture') return sum
        if (lesson.type === 'test') {
          const qs = lesson.questions ?? []
          return sum + qs.reduce((qSum, q) => qSum + (q.points ?? 5), 0)
        }
        return sum + (lesson.maxPoints ?? 0)
      }, 0)

      return {
        id: course.id,
        title: course.title,
        totalPoints,
        totalTasks,
      }
    })
  }

  /** Returns lesson + questions for validation by IDs. Used by CoursesTestService. */
  static async getTestLessonWithQuestionsById(courseId: number, lessonId: number) {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
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

    if (!lesson || lesson.type !== 'test' || lesson.module?.course?.id !== courseId) {
      return null
    }

    return {
      course: lesson.module!.course!,
      lesson,
      questions: lesson.questions ?? [],
    }
  }

  /** Returns lesson + questions for validation. Used by CoursesTestService. */
  static async getTestLessonWithQuestions(courseSlug: string, lessonSlug: string) {
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
    if (!lesson || lesson.type !== 'test') return null

    return {
      course: lesson.module!.course!,
      lesson,
      questions: lesson.questions ?? [],
    }
  }
}
