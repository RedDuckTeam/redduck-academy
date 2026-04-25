import { asc, count, countDistinct, desc, eq, inArray, sql, and } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import { userLessons, userCertificates } from '../../db/schema'
import { buildSearchFilter, buildWhereClause } from '../../lib/query-builder'
import { AppError } from '../../lib/errors'
import { payloadSchema } from '@redduck/payload-config'
import type { CompletedLesson } from '../../descriptions/user'
import { LessonsService } from '../lessons/lessons.service'
import { CoursesService } from '../courses/courses.service'
import { ReviewService } from '../review/review.service'
import { CodingTaskService } from '../coding-task/coding-task.service'

const { lessons } = payloadSchema

export type AdminStats = {
  totalUsers: number
  totalLessonCompletions: number
  averageLessonsPerUser: number
  activeLearners: number
  totalCertificates: number
}

export type AdminUserRow = {
  id: string
  email: string | null
  name: string
  username: string | null
  image: string | null
  role: 'user' | 'admin'
  isPrivate: boolean
  blacklisted: boolean
  createdAt: string
  lessonsPassed: number
  coursesPassed: number
}

export type AdminCertificateRow = {
  id: string
  userId: string
  userEmail: string | null
  userName: string
  courseSlug: string
  name: string
  status: 'created' | 'requested' | 'claimed'
  issuedAt: string
  certsForCourse: number
  metadataUri: string | null
  imageUrl: string | null
  tokenId: string | null
  txHash: string | null
}

export class AdminService {
  static async getStats(): Promise<AdminStats> {
    const [[usersAgg], [lessonsAgg], [certsAgg], [activeAgg]] = await Promise.all([
      db.select({ c: count() }).from(user),
      db.select({ c: count() }).from(userLessons).where(eq(userLessons.isCompleted, true)),
      db.select({ c: count() }).from(userCertificates),
      db
        .select({ c: countDistinct(userLessons.userId) })
        .from(userLessons)
        .where(eq(userLessons.isCompleted, true)),
    ])

    const totalUsers = Number(usersAgg?.c ?? 0)
    const totalLessonCompletions = Number(lessonsAgg?.c ?? 0)
    const totalCertificates = Number(certsAgg?.c ?? 0)
    const activeLearners = Number(activeAgg?.c ?? 0)

    const averageLessonsPerUser = totalUsers === 0 ? 0 : totalLessonCompletions / totalUsers

    return {
      totalUsers,
      totalLessonCompletions,
      averageLessonsPerUser,
      activeLearners,
      totalCertificates,
    }
  }

  static async getUsersPage(input: {
    limit: number
    offset: number
    sortBy?: 'email' | 'name' | 'username' | 'createdAt' | 'lessonsPassed' | 'coursesPassed'
    sortDir?: 'asc' | 'desc'
    search?: string
  }): Promise<{ rows: AdminUserRow[]; total: number }> {
    const { limit, offset, sortBy = 'createdAt', sortDir = 'desc', search } = input

    const whereClause = buildWhereClause(
      buildSearchFilter(search, [user.email, user.name, user.username]),
    )

    const [{ total: totalRaw }] = await db.select({ total: count() }).from(user).where(whereClause)
    const total = Number(totalRaw ?? 0)

    const lessonsAgg = db
      .select({ userId: userLessons.userId, cnt: count().as('lessons_cnt') })
      .from(userLessons)
      .where(eq(userLessons.isCompleted, true))
      .groupBy(userLessons.userId)
      .as('lessons_agg')

    const certsAgg = db
      .select({ userId: userCertificates.userId, cnt: count().as('certs_cnt') })
      .from(userCertificates)
      .groupBy(userCertificates.userId)
      .as('certs_agg')

    const sortColMap = {
      email: user.email,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      lessonsPassed: sql<number>`coalesce(${lessonsAgg.cnt}, 0)`,
      coursesPassed: sql<number>`coalesce(${certsAgg.cnt}, 0)`,
    }
    const orderExpr = sortDir === 'desc' ? desc(sortColMap[sortBy]) : asc(sortColMap[sortBy])

    const pageUsers = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        image: user.image,
        role: user.role,
        isPrivate: user.isPrivate,
        blacklisted: user.blacklisted,
        createdAt: user.createdAt,
        lessonsPassed: sql<number>`coalesce(${lessonsAgg.cnt}, 0)`,
        coursesPassed: sql<number>`coalesce(${certsAgg.cnt}, 0)`,
      })
      .from(user)
      .leftJoin(lessonsAgg, eq(user.id, lessonsAgg.userId))
      .leftJoin(certsAgg, eq(user.id, certsAgg.userId))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset)

    const rows: AdminUserRow[] = pageUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      username: u.username,
      image: u.image,
      role: u.role as 'user' | 'admin',
      isPrivate: u.isPrivate,
      blacklisted: u.blacklisted,
      createdAt: u.createdAt.toISOString(),
      lessonsPassed: Number(u.lessonsPassed ?? 0),
      coursesPassed: Number(u.coursesPassed ?? 0),
    }))

    return { rows, total }
  }

  static async getCertificatesPage(input: {
    limit: number
    offset: number
    sortBy?: 'issuedAt' | 'userEmail' | 'courseSlug' | 'status' | 'name'
    sortDir?: 'asc' | 'desc'
    status?: 'all' | 'created' | 'requested' | 'claimed'
    search?: string
  }): Promise<{ rows: AdminCertificateRow[]; total: number }> {
    const { limit, offset, sortBy = 'issuedAt', sortDir = 'desc', status, search } = input

    const whereClause = buildWhereClause(
      status && status !== 'all' ? eq(userCertificates.status, status) : undefined,
      buildSearchFilter(search, [user.email, user.name, userCertificates.courseSlug]),
    )

    const [{ total: totalRaw }] = await db
      .select({ total: count() })
      .from(userCertificates)
      .innerJoin(user, eq(userCertificates.userId, user.id))
      .where(whereClause)

    const total = Number(totalRaw ?? 0)

    const sortColMap = {
      issuedAt: userCertificates.issuedAt,
      userEmail: user.email,
      courseSlug: userCertificates.courseSlug,
      status: userCertificates.status,
      name: userCertificates.name,
    }
    const sortCol = sortColMap[sortBy]
    const orderExpr = sortDir === 'asc' ? asc(sortCol) : desc(sortCol)

    const pageRows = await db
      .select({
        id: userCertificates.id,
        userId: userCertificates.userId,
        userEmail: user.email,
        userName: user.name,
        courseSlug: userCertificates.courseSlug,
        name: userCertificates.name,
        status: userCertificates.status,
        issuedAt: userCertificates.issuedAt,
        metadataUri: userCertificates.metadataUri,
        imageUrl: userCertificates.imageUrl,
        tokenId: userCertificates.tokenId,
        txHash: userCertificates.txHash,
      })
      .from(userCertificates)
      .innerJoin(user, eq(userCertificates.userId, user.id))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset)

    if (pageRows.length === 0) {
      return { rows: [], total }
    }

    const userIds = [...new Set(pageRows.map((r) => r.userId).filter(Boolean))] as string[]

    const countRows = await db
      .select({
        userId: userCertificates.userId,
        courseSlug: userCertificates.courseSlug,
        n: count(),
      })
      .from(userCertificates)
      .where(inArray(userCertificates.userId, userIds))
      .groupBy(userCertificates.userId, userCertificates.courseSlug)

    const countMap = new Map(countRows.map((r) => [`${r.userId}:${r.courseSlug}`, Number(r.n)]))

    const rows: AdminCertificateRow[] = pageRows.map((r) => ({
      id: r.id,
      userId: r.userId!,
      userEmail: r.userEmail,
      userName: r.userName,
      courseSlug: r.courseSlug,
      name: r.name,
      status: (r.status ?? 'created') as 'created' | 'requested' | 'claimed',
      issuedAt: r.issuedAt.toISOString(),
      certsForCourse: countMap.get(`${r.userId}:${r.courseSlug}`) ?? 1,
      metadataUri: r.metadataUri,
      imageUrl: r.imageUrl,
      tokenId: r.tokenId,
      txHash: r.txHash,
    }))

    return { rows, total }
  }

  static async banUser(userId: string, ban: boolean): Promise<{ blacklisted: boolean }> {
    const update: { blacklisted: boolean; isPrivate?: boolean } = { blacklisted: ban }
    if (ban) update.isPrivate = true
    const [updated] = await db.update(user).set(update).where(eq(user.id, userId)).returning({ blacklisted: user.blacklisted })
    if (!updated) throw new AppError(404, 'User not found')
    return { blacklisted: updated.blacklisted }
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

  static async getLessonForUser(userId: string, courseSlug: string, lessonSlug: string) {
    const lesson = await LessonsService.getLesson(courseSlug, lessonSlug)

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

    // Admin sees raw review feedback — no sanitization of hidden criteria
    let submissions: Awaited<ReturnType<typeof ReviewService.getSubmissionsForUserLesson>> = []
    if (lesson.type === 'review_task' && userLesson?.id) {
      submissions = await ReviewService.getSubmissionsForUserLesson(userLesson.id)
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
}
