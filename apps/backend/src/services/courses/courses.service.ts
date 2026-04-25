import { eq, ne } from 'drizzle-orm'
import { payloadDb } from '../../db'
import { AppError } from '../../lib/errors'

export class CoursesService {
  static async getCourseBySlug(slug: string) {
    const result = await payloadDb.query.courses.findFirst({
      where: (c, { and }) => and(eq(c.slug, slug), ne(c.isHidden, true)),
      with: {
        modules: {
          where: (m) => ne(m.isHidden, true),
          orderBy: (m, { asc }) => [asc(m.order)],
          with: {
            lessons: {
              where: (l) => ne(l.isHidden, true),
              orderBy: (l, { asc }) => [asc(l.order)],
            },
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
      where: (c) => ne(c.isHidden, true),
      orderBy: (c, { asc }) => [asc(c.order)],
      with: {
        prerequisiteCourse: { columns: { id: true, slug: true, title: true } },
        modules: {
          where: (m) => ne(m.isHidden, true),
          orderBy: (m, { asc }) => [asc(m.order)],
          with: {
            lessons: {
              where: (l) => ne(l.isHidden, true),
              orderBy: (l, { asc }) => [asc(l.order)],
              columns: {
                id: true,
                title: true,
                slug: true,
                module: true,
                order: true,
                type: true,
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
      where: (c) => ne(c.isHidden, true),
      orderBy: (c, { asc }) => [asc(c.order)],
      with: {
        modules: {
          where: (m) => ne(m.isHidden, true),
          with: {
            lessons: {
              where: (l) => ne(l.isHidden, true),
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

      return {
        id: course.id,
        title: course.title,
        totalTasks,
      }
    })
  }

  /** Returns lesson + questions for validation by IDs. Used by CoursesTestService. */
  static async getTestLessonWithQuestionsById(courseId: number, lessonId: number) {
    const lesson = await payloadDb.query.lessons.findFirst({
      where: (l, { and }) => and(eq(l.id, lessonId), ne(l.isHidden, true)),
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

    if (
      !lesson ||
      lesson.type !== 'test' ||
      lesson.module?.course?.id !== courseId ||
      lesson.module?.isHidden === true ||
      lesson.module?.course?.isHidden === true
    ) {
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
      where: (l, { and }) => and(eq(l.slug, lessonSlug), ne(l.isHidden, true)),
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

    const lesson = candidates.find(
      (l) =>
        l.module?.course?.slug === courseSlug && l.module?.isHidden !== true && l.module?.course?.isHidden !== true,
    )
    if (!lesson || lesson.type !== 'test') return null

    return {
      course: lesson.module!.course!,
      lesson,
      questions: lesson.questions ?? [],
    }
  }
}
