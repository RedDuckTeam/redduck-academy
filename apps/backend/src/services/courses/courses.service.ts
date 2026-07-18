import { eq, ne, or } from 'drizzle-orm'
import { payloadDb } from '../../db'
import { AppError } from '../../lib/errors'

export class CoursesService {
  static async getCourseBySlug(slug: string) {
    // Lessons projected to non-sensitive columns only. AI-grader fields, expected test outputs,
    // and fixture sources are never returned by this endpoint — see LessonsService for the
    // per-lesson route that strips them lazily. Course-detail consumers only need navigation
    // shape (slug/title/order/type), so no learner-facing UX regresses.
    const result = await payloadDb.query.courses.findFirst({
      // Preview-aware: a hidden but `previewable` course (and its modules/lessons) stays fetchable by
      // its direct slug for pre-launch testing, while the list endpoints below keep excluding it.
      where: (c, { and }) => and(eq(c.slug, slug), or(ne(c.isHidden, true), eq(c.previewable, true))),
      with: {
        modules: {
          where: (m) => or(ne(m.isHidden, true), eq(m.previewable, true)),
          orderBy: (m, { asc }) => [asc(m.order)],
          with: {
            lessons: {
              where: (l) => or(ne(l.isHidden, true), eq(l.previewable, true)),
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
