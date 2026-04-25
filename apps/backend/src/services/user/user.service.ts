import { eq, and, count, inArray, desc, ne } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import { userLessons, userCertificates } from '../../db/schema'
import { payloadSchema } from '@redduck/payload-config'
import type { CompletedLesson } from '../../descriptions/user'
import type { ReviewFeedback } from '../../types/review-feedback'
import { LessonsService } from '../lessons/lessons.service'
import { CoursesService } from '../courses/courses.service'
import { CertificatesService } from '../certificates/certificates.service'
import { ReviewService } from '../review/review.service'
import { CodingTaskService } from '../coding-task/coding-task.service'
import { sanitizeReviewFeedbackForLearner } from '../review/sanitize-review-feedback-for-learner'
import { AppError } from '../../lib/errors'
import { containsProfanity } from '../../lib/profanity'
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
    const [completedLessonRows, [userRow]] = await Promise.all([
      db
        .select({ lessonId: userLessons.lessonId, updatedAt: userLessons.updatedAt })
        .from(userLessons)
        .where(and(eq(userLessons.userId, userId), eq(userLessons.isCompleted, true))),
      db.select({ isPrivate: user.isPrivate }).from(user).where(eq(user.id, userId)).limit(1),
    ])
    if (!userRow) throw new AppError(404, 'User not found')

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

    const nowUtc = new Date()
    const todayStr = nowUtc.toISOString().split('T')[0]
    const yesterdayUtc = new Date(nowUtc)
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1)
    const yesterdayStr = yesterdayUtc.toISOString().split('T')[0]

    let currentStreak = 0
    const startOffset =
      sortedDates[0] === todayStr ? 0 : sortedDates[0] === yesterdayStr ? 1 : null

    if (startOffset !== null) {
      const anchor = new Date(nowUtc)
      anchor.setUTCDate(anchor.getUTCDate() - startOffset)
      for (let i = 0; i < sortedDates.length; i++) {
        const expected = new Date(anchor)
        expected.setUTCDate(expected.getUTCDate() - i)
        const expectedStr = expected.toISOString().split('T')[0]
        if (sortedDates[i] === expectedStr) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Dense rank among public profiles only; private users are not ranked
    let placeInRanking = 0
    if (!userRow.isPrivate) {
      const allUserLessonCounts = await db
        .select({ lessonCount: count(userLessons.id) })
        .from(userLessons)
        .innerJoin(user, eq(userLessons.userId, user.id))
        .where(and(eq(userLessons.isCompleted, true), eq(user.isPrivate, false)))
        .groupBy(userLessons.userId)

      const higherDistinctCounts = new Set(
        allUserLessonCounts.map((r) => Number(r.lessonCount)).filter((c) => c > completedLessonsCount),
      )
      placeInRanking = higherDistinctCounts.size + 1
    }

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
        username: user.username,
        completedLessonsCount: count(userLessons.id),
      })
      .from(user)
      .leftJoin(userLessons, and(eq(userLessons.userId, user.id), eq(userLessons.isCompleted, true)))
      .where(eq(user.isPrivate, false))
      .groupBy(user.id, user.name, user.username)
      .orderBy(desc(count(userLessons.id)))
      .limit(10)

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
        username: u.username,
        completedLessonsCount: lessonCount,
        completedCoursesCount: certMap.get(u.userId) ?? 0,
      }
    })
  }

  static async updateUserName(userId: string, name: string) {
    if (containsProfanity(name)) throw new AppError(400, 'Name contains inappropriate language')
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
      .select({ id: user.id, username: user.username, skipPrerequisites: user.skipPrerequisites, isPrivate: user.isPrivate, bio: user.bio, name: user.name, image: user.image, role: user.role, blacklisted: user.blacklisted })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
    if (!row) throw new AppError(404, 'User not found')
    return { id: row.id, username: row.username, skipPrerequisites: row.skipPrerequisites, isPrivate: row.isPrivate, bio: row.bio, name: row.name, image: row.image, role: row.role, blacklisted: row.blacklisted }
  }

  static async getPublicProfile(username: string) {
    const [userRow] = await db
      .select({ id: user.id, name: user.name, bio: user.bio, image: user.image, isPrivate: user.isPrivate })
      .from(user)
      .where(eq(user.username, username))
      .limit(1)

    if (!userRow) throw new AppError(404, 'User not found')

    if (userRow.isPrivate) {
      return { username, isPrivate: true as const }
    }

    const [rating, certificates] = await Promise.all([
      UserService.getRating(),
      CertificatesService.getUserCertificates(userRow.id),
    ])

    const userRating = rating.find((r) => r.userId === userRow.id)

    return {
      username,
      isPrivate: false as const,
      name: userRow.name,
      bio: userRow.bio,
      image: userRow.image,
      rank: userRating?.rank ?? 0,
      completedLessonsCount: userRating?.completedLessonsCount ?? 0,
      certificates,
    }
  }

  static async updateUserUsername(userId: string, username: string) {
    if (containsProfanity(username)) throw new AppError(400, 'Username contains inappropriate language')
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1)
    if (existing && existing.id !== userId) throw new AppError(400, 'Username already taken')
    const [updated] = await db.update(user).set({ username }).where(eq(user.id, userId)).returning({ username: user.username })
    if (!updated) throw new AppError(404, 'User not found')
    return { username: updated.username! }
  }

  static async updateUserBio(userId: string, bio: string | null) {
    if (bio && containsProfanity(bio)) throw new AppError(400, 'Bio contains inappropriate language')
    const [updated] = await db.update(user).set({ bio }).where(eq(user.id, userId)).returning({ bio: user.bio })
    if (!updated) throw new AppError(404, 'User not found')
    return { bio: updated.bio }
  }

  static async updateUserSettings(userId: string, settings: { skipPrerequisites?: boolean; isPrivate?: boolean }) {
    if (settings.isPrivate === false) {
      const [row] = await db.select({ blacklisted: user.blacklisted }).from(user).where(eq(user.id, userId)).limit(1)
      if (row?.blacklisted) throw new AppError(403, 'Banned users cannot make their profile public')
    }
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
