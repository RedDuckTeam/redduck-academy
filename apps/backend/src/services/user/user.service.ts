import { eq, and, count, inArray, desc, ne } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import { userLessons, userCertificates } from '../../db/schema'
import { payloadSchema } from '@redduck/payload-config'
import type { CompletedLesson } from '../../descriptions/user'
import type { ReviewFeedback } from '../../types/review-feedback'
import { LessonsService } from '../lessons/lessons.service'
import { CoursesService } from '../courses/courses.service'
import { ReviewService } from '../review/review.service'
import { CodingTaskService } from '../coding-task/coding-task.service'
import { sanitizeReviewFeedbackForLearner } from '../review/sanitize-review-feedback-for-learner'
import { AppError } from '../../lib/errors'
import { CoursePrerequisitesService } from '../courses/course-prerequisites.service'

const { lessons, courses } = payloadSchema

export class UserService {
  static async getLessonForUser(userId: string, courseSlug: string, lessonSlug: string) {
    const lesson = await LessonsService.getLesson(courseSlug, lessonSlug)

    // Enforce course prerequisites for non-lecture lessons
    if (lesson.type !== 'lecture') {
      const access = await CoursePrerequisitesService.checkCourseAccess(userId, courseSlug)
      if (!access.allowed) {
        throw new AppError(403, `Course locked: complete "${access.prerequisiteCourseTitle}" first`, {
          prerequisiteCourseSlug: access.prerequisiteCourseSlug,
          prerequisiteCourseTitle: access.prerequisiteCourseTitle,
        })
      }
    }

    const [userLesson] = await db
      .select({
        userAnswers: userLessons.userAnswers,
        isCompleted: userLessons.isCompleted,
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
      userAnswers: userLesson?.isCompleted
        ? ((userLesson.userAnswers as Record<string, string[]> | null) ?? null)
        : null,
      isCompleted: userLesson?.isCompleted ?? false,
      correctAnswers,
      ...(lesson.type === 'review_task' ? { submissions } : {}),
      ...(lesson.type === 'coding_task' ? { submissions: codingTaskSubmissions } : {}),
    }
  }

  static async getUserCompletedLessons(userId: string): Promise<CompletedLesson[]> {
    const completedLessons = await db.query.userLessons.findMany({
      where: and(eq(userLessons.userId, userId), eq(userLessons.isCompleted, true)),
      columns: { lessonId: true },
      orderBy: desc(userLessons.createdAt),
    })

    if (completedLessons.length === 0) return []

    const lessonIds = [...new Set(completedLessons.map((c) => c.lessonId))]
    const payloadLessons = await payloadDb.query.lessons.findMany({
      where: inArray(lessons.id, lessonIds),
      with: { module: { with: { course: true } } },
    })

    return payloadLessons
      .filter((l) => l.module?.course?.slug)
      .map((lesson) => ({
        courseSlug: lesson.module!.course!.slug ?? '',
        lessonId: lesson.id,
        lessonSlug: lesson.slug ?? '',
      }))
  }

  static async getProgressCards(userId: string) {
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

    const totalCoursesCount = await payloadDb.query.courses
      .findMany({ where: (c) => ne(c.isHidden, true), columns: { id: true } })
      .then((r) => r.length)

    const uniqueDateStrings = new Set(completedLessonRows.map((l) => new Date(l.updatedAt).toISOString().split('T')[0]))
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

    // Compute dense rank: count distinct lesson counts that are strictly higher than this user's
    const allUserLessonCounts = await db
      .select({ lessonCount: count(userLessons.id) })
      .from(userLessons)
      .where(eq(userLessons.isCompleted, true))
      .groupBy(userLessons.userId)

    const higherDistinctCounts = new Set(
      allUserLessonCounts.map((r) => Number(r.lessonCount)).filter((c) => c > completedLessonsCount),
    )
    const placeInRanking = higherDistinctCounts.size + 1

    return {
      completedLessonsCount,
      completedCoursesCount,
      totalCoursesCount,
      currentStreak,
      placeInRanking,
    }
  }

  static async getRating() {
    const usersWithLessons = await db
      .select({
        userId: user.id,
        userName: user.name,
        completedLessonsCount: count(userLessons.id),
      })
      .from(user)
      .leftJoin(userLessons, and(eq(userLessons.userId, user.id), eq(userLessons.isCompleted, true)))
      .where(eq(user.isPrivate, false))
      .groupBy(user.id, user.name)
      .orderBy(desc(count(userLessons.id)))

    const certificateCounts = await db
      .select({
        userId: userCertificates.userId,
        completedCoursesCount: count(userCertificates.id),
      })
      .from(userCertificates)
      .groupBy(userCertificates.userId)

    const certMap = new Map(certificateCounts.map((c) => [c.userId, Number(c.completedCoursesCount)]))

    let currentRank = 0
    let lastLessonsCount: number | null = null

    return usersWithLessons.map((u) => {
      const lessonCount = Number(u.completedLessonsCount)
      if (lastLessonsCount === null || lessonCount !== lastLessonsCount) {
        currentRank++
        lastLessonsCount = lessonCount
      }
      return {
        rank: currentRank,
        userId: u.userId,
        userName: u.userName,
        completedLessonsCount: lessonCount,
        completedCoursesCount: certMap.get(u.userId) ?? 0,
      }
    })
  }

  static async updateUserName(userId: string, name: string) {
    const [updated] = await db.update(user).set({ name }).where(eq(user.id, userId)).returning({ name: user.name })
    return { name: updated.name }
  }

  static async getUserImage(userId: string): Promise<string | null> {
    const [row] = await db.select({ image: user.image }).from(user).where(eq(user.id, userId)).limit(1)
    return row?.image ?? null
  }

  static async updateUserAvatar(userId: string, imageUrl: string) {
    const [updated] = await db
      .update(user)
      .set({ image: imageUrl })
      .where(eq(user.id, userId))
      .returning({ image: user.image })
    return { imageUrl: updated.image }
  }

  static async getUserStats(userId: string) {
    const [countResult] = await db
      .select({ count: count() })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.isCompleted, true)))

    return {
      completedLessonsCount: countResult?.count ?? 0,
    }
  }

  static async getUserSettings(userId: string) {
    const [row] = await db
      .select({ skipPrerequisites: user.skipPrerequisites, isPrivate: user.isPrivate })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
    if (!row) throw new AppError(404, 'User not found')
    return { skipPrerequisites: row.skipPrerequisites, isPrivate: row.isPrivate }
  }

  static async updateUserSettings(userId: string, settings: { skipPrerequisites?: boolean; isPrivate?: boolean }) {
    const [updated] = await db
      .update(user)
      .set({
        ...(settings.skipPrerequisites !== undefined ? { skipPrerequisites: settings.skipPrerequisites } : {}),
        ...(settings.isPrivate !== undefined ? { isPrivate: settings.isPrivate } : {}),
      })
      .where(eq(user.id, userId))
      .returning({ skipPrerequisites: user.skipPrerequisites, isPrivate: user.isPrivate })
    if (!updated) throw new AppError(404, 'User not found')
    return { skipPrerequisites: updated.skipPrerequisites, isPrivate: updated.isPrivate }
  }
}
