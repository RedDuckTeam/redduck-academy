import { eq, and, count, inArray, desc } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import { userLessons } from '../../db/schema'
import { payloadSchema } from '@redduck/payload-config'
import type { CompletedLesson } from '../../descriptions/user'
import { LessonsService } from '../lessons/lessons.service'
import { CoursesService } from '../courses/courses.service'

const { lessons } = payloadSchema

export class UserService {
  static async getLessonForUser(userId: string, courseSlug: string, lessonSlug: string) {
    const lesson = await LessonsService.getLesson(courseSlug, lessonSlug)

    const [userLesson] = await db
      .select({ score: userLessons.score, userAnswers: userLessons.userAnswers, isCompleted: userLessons.isCompleted })
      .from(userLessons)
      .where(
        and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lesson.id), eq(userLessons.isCompleted, true)),
      )
      .limit(1)

    let correctAnswers: Record<string, string[]> | null = null
    if (lesson.type === 'test' && userLesson?.isCompleted && lesson.module?.course?.id) {
      const result = await CoursesService.getTestLessonWithQuestionsById(
        lesson.module.course.id as number,
        lesson.id,
      )
      if (result) {
        correctAnswers = {}
        result.questions.forEach((q) => {
          correctAnswers![q.id] = q.options.filter((o) => o.isCorrect).map((o) => o.id)
        })
      }
    }

    return {
      ...lesson,
      earnedPoints: userLesson?.score ?? null,
      userAnswers: (userLesson?.userAnswers as Record<string, string[]> | null) ?? null,
      isCompleted: userLesson?.isCompleted ?? false,
      correctAnswers,
    }
  }

  static async getUserCompletedLessons(userId: string): Promise<CompletedLesson[]> {
    const completedLessons = await db.query.userLessons.findMany({
      where: and(eq(userLessons.userId, userId), eq(userLessons.isCompleted, true)),
      columns: { lessonId: true, score: true },
      orderBy: desc(userLessons.createdAt),
    })

    if (completedLessons.length === 0) return []

    const scoreByLessonId = new Map<number, number>()
    for (const c of completedLessons) {
      if (!scoreByLessonId.has(c.lessonId)) {
        scoreByLessonId.set(c.lessonId, c.score ?? 0)
      }
    }

    const lessonIds = [...scoreByLessonId.keys()]
    const payloadLessons = await payloadDb.query.lessons.findMany({
      where: inArray(lessons.id, lessonIds),
      with: {
        module: {
          with: {
            course: true,
          },
        },
        questions: true,
      },
    })

    return payloadLessons
      .filter((l) => l.module?.course?.slug)
      .map((lesson) => {
        const courseSlug = lesson.module!.course!.slug ?? ''
        const pointsEarned = scoreByLessonId.get(lesson.id) ?? 0

        const maxPoints =
          lesson.type === 'test'
            ? lesson.maxPoints ?? (lesson.questions ?? []).reduce((sum, q) => sum + (q.points ?? 0), 0)
            : lesson.maxPoints ?? 0

        return {
          courseSlug,
          lessonId: lesson.id,
          lessonSlug: lesson.slug ?? '',
          pointsEarned,
          maxPoints,
        }
      })
  }

  static async getUserStats(userId: string) {
    const [userRecord] = await db.select({ points: user.points }).from(user).where(eq(user.id, userId)).limit(1)

    const [countResult] = await db
      .select({ count: count() })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.isCompleted, true)))

    return {
      points: userRecord?.points ?? 0,
      completedLessonsCount: countResult?.count ?? 0,
    }
  }
}
