import { eq, and, count, inArray, desc } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import { userLessons } from '../../db/schema'
import { payloadSchema } from '@redduck/payload-config'
import type { CompletedLesson } from '../../descriptions/user'
import type { ReviewFeedback } from '../../types/review-feedback'
import { LessonsService } from '../lessons/lessons.service'
import { CoursesService } from '../courses/courses.service'
import { ReviewService } from '../review/review.service'
import { CodingTaskService } from '../coding-task/coding-task.service'
import { sanitizeReviewFeedbackForLearner } from '../review/sanitize-review-feedback-for-learner'

const { lessons, courses } = payloadSchema

export class UserService {
  static async getLessonForUser(userId: string, courseSlug: string, lessonSlug: string) {
    const lesson = await LessonsService.getLesson(courseSlug, lessonSlug)

    const [userLesson] = await db
      .select({
        score: userLessons.score,
        userAnswers: userLessons.userAnswers,
        isCompleted: userLessons.isCompleted,
        attemptsLeft: userLessons.attemptsLeft,
        id: userLessons.id,
      })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lesson.id)))
      .limit(1)

    let correctAnswers: Record<string, string[]> | null = null
    if (lesson.type === 'test' && userLesson?.isCompleted && lesson.module?.course?.id) {
      const result = await CoursesService.getTestLessonWithQuestionsById(lesson.module.course.id as number, lesson.id)
      if (result) {
        correctAnswers = {}
        result.questions.forEach((q) => {
          correctAnswers![q.id] = q.options.filter((o) => o.isCorrect).map((o) => o.id)
        })
      }
    }

    let codingTaskSubmissions: Awaited<ReturnType<typeof CodingTaskService.getSubmissionsForUserLesson>> = []
    if (lesson.type === 'coding_task' && userLesson?.id) {
      codingTaskSubmissions = await CodingTaskService.getSubmissionsForUserLesson(userLesson.id)
    }

    let submissions: Awaited<ReturnType<typeof ReviewService.getSubmissionsForUserLesson>> = []
    if (lesson.type === 'review_task' && userLesson?.id) {
      const raw = await ReviewService.getSubmissionsForUserLesson(userLesson.id)
      const hiddenCriteriaTaskIds = new Set<string>()
      for (const t of lesson.reviewGradingTasks ?? []) {
        const row = t as { id: string; criteriaHidden?: boolean }
        if (row.criteriaHidden) hiddenCriteriaTaskIds.add(row.id)
      }
      submissions = raw.map((s) => ({
        ...s,
        feedback: sanitizeReviewFeedbackForLearner(s.feedback as ReviewFeedback | null, hiddenCriteriaTaskIds),
      }))
    }

    return {
      ...lesson,
      earnedPoints: userLesson?.isCompleted ? (userLesson.score ?? null) : null,
      userAnswers: userLesson?.isCompleted
        ? ((userLesson.userAnswers as Record<string, string[]> | null) ?? null)
        : null,
      isCompleted: userLesson?.isCompleted ?? false,
      correctAnswers,
      ...(lesson.type === 'review_task'
        ? {
            attemptsLeft: userLesson?.attemptsLeft ?? 50,
            submissions,
          }
        : {}),
      ...(lesson.type === 'coding_task'
        ? {
            attemptsLeft: userLesson?.attemptsLeft ?? 50,
            submissions: codingTaskSubmissions,
          }
        : {}),
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
            ? (lesson.maxPoints ?? (lesson.questions ?? []).reduce((sum, q) => sum + (q.points ?? 0), 0))
            : (lesson.maxPoints ?? 0)

        return {
          courseSlug,
          lessonId: lesson.id,
          lessonSlug: lesson.slug ?? '',
          pointsEarned,
          maxPoints,
        }
      })
  }

  static async getProgressCards(userId: string) {
    const [userRecord] = await db.select({ points: user.points }).from(user).where(eq(user.id, userId)).limit(1)

    const completedLessonRows = await db
      .select({ lessonId: userLessons.lessonId, updatedAt: userLessons.updatedAt })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.isCompleted, true)))

    const completedLessonsCount = completedLessonRows.length

    let completedCoursesCount = 0
    if (completedLessonRows.length > 0) {
      const lessonIds = completedLessonRows.map((l) => l.lessonId)
      const payloadLessons = await payloadDb.query.lessons.findMany({
        where: inArray(lessons.id, lessonIds),
        with: { module: { with: { course: true } } },
      })
      const uniqueCourseIds = new Set(
        payloadLessons.filter((l) => l.module?.course?.id).map((l) => l.module!.course!.id),
      )
      completedCoursesCount = uniqueCourseIds.size
    }

    const totalCoursesCount = await payloadDb.query.courses.findMany({ columns: { id: true } }).then((r) => r.length)

    const uniqueDateStrings = new Set(
      completedLessonRows.map((l) => new Date(l.updatedAt).toISOString().split('T')[0]),
    )
    const sortedDates = [...uniqueDateStrings].sort().reverse()

    let currentStreak = 0
    const today = new Date()
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today)
      expected.setUTCDate(expected.getUTCDate() - i)
      const expectedStr = expected.toISOString().split('T')[0]
      if (sortedDates[i] === expectedStr) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      points: userRecord?.points ?? 0,
      completedLessonsCount,
      completedCoursesCount,
      totalCoursesCount,
      currentStreak,
    }
  }

  static async updateUserName(userId: string, name: string) {
    const [updated] = await db
      .update(user)
      .set({ name })
      .where(eq(user.id, userId))
      .returning({ name: user.name })
    return { name: updated.name }
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
