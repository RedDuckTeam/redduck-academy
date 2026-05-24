import { asc, count, countDistinct, desc, eq, inArray, sql, and, ne } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import {
  userLessons,
  userCertificates,
  projectUserSubmissions,
  codingTaskSubmissions,
} from '../../db/schema'
import { buildSearchFilter, buildWhereClause } from '../../lib/query-builder'
import { AppError } from '../../lib/errors'
import { payloadSchema } from '@redduck/payload-config'
import type { CompletedLesson } from '../../descriptions/user'
import { LessonsService } from '../lessons/lessons.service'
import { CoursesService } from '../courses/courses.service'
import { ReviewService } from '../review/review.service'
import { CodingTaskService } from '../coding-task/coding-task.service'

const { lessons, modules, courses } = payloadSchema

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

  static async getLessonsTree() {
    const allCourses = await payloadDb.query.courses.findMany({
      where: (c) => ne(c.isHidden, true),
      orderBy: (c, { asc: a }) => [a(c.order)],
      columns: { id: true, title: true, slug: true, order: true },
      with: {
        modules: {
          where: (m) => ne(m.isHidden, true),
          orderBy: (m, { asc: a }) => [a(m.order)],
          columns: { id: true, title: true, slug: true, order: true },
          with: {
            lessons: {
              where: (l) => ne(l.isHidden, true),
              orderBy: (l, { asc: a }) => [a(l.order)],
              columns: { id: true, title: true, slug: true, order: true, type: true },
            },
          },
        },
      },
    })
    const allLessonIds = allCourses.flatMap((c) =>
      (c.modules ?? []).flatMap((m) => (m.lessons ?? []).map((l) => l.id)),
    )

    if (allLessonIds.length === 0) return []

    const completedRows = await db
      .select({ lessonId: userLessons.lessonId, c: count() })
      .from(userLessons)
      .where(and(eq(userLessons.isCompleted, true), inArray(userLessons.lessonId, allLessonIds)))
      .groupBy(userLessons.lessonId)
    const completedMap = new Map(completedRows.map((r) => [r.lessonId, Number(r.c)]))

    const codingRows = await db
      .select({
        lessonId: userLessons.lessonId,
        total: count(),
        success: sql<number>`count(*) filter (where ${codingTaskSubmissions.passed} = true)`,
      })
      .from(codingTaskSubmissions)
      .innerJoin(userLessons, eq(codingTaskSubmissions.userLessonId, userLessons.id))
      .where(inArray(userLessons.lessonId, allLessonIds))
      .groupBy(userLessons.lessonId)
    const codingMap = new Map(codingRows.map((r) => [r.lessonId, { total: Number(r.total), success: Number(r.success) }]))

    const projectRows = await db
      .select({
        lessonId: userLessons.lessonId,
        total: count(),
        // "Passed" = review finished AND the grader's verdict was a pass. `status = 'completed'`
        // alone only means the review ran; it includes failing verdicts, so we must also check
        // the authoritative `feedback.lessonPassed` flag (stored as JSONB).
        success: sql<number>`count(*) filter (where ${projectUserSubmissions.status} = 'completed' and ${projectUserSubmissions.feedback}->>'lessonPassed' = 'true')`,
      })
      .from(projectUserSubmissions)
      .innerJoin(userLessons, eq(projectUserSubmissions.userLessonId, userLessons.id))
      .where(inArray(userLessons.lessonId, allLessonIds))
      .groupBy(userLessons.lessonId)
    const projectMap = new Map(projectRows.map((r) => [r.lessonId, { total: Number(r.total), success: Number(r.success) }]))

    return allCourses
      .filter((c) => c.slug)
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug ?? '',
        order: Number(c.order ?? 0),
        modules: (c.modules ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          slug: m.slug ?? null,
          order: Number(m.order ?? 0),
          lessons: (m.lessons ?? []).map((l) => {
            const stats =
              l.type === 'coding_task'
                ? codingMap.get(l.id)
                : l.type === 'review_task'
                  ? projectMap.get(l.id)
                  : undefined
            return {
              id: l.id,
              title: l.title,
              slug: l.slug ?? '',
              type: l.type,
              order: Number(l.order ?? 0),
              completedCount: completedMap.get(l.id) ?? 0,
              totalAttempts: stats?.total ?? 0,
              successAttempts: stats?.success ?? 0,
            }
          }),
        })),
      }))
  }

  static async getLessonSubmissionsPage(input: {
    courseSlug: string
    lessonSlug: string
    limit: number
    offset: number
    search?: string
  }) {
    const { courseSlug, lessonSlug, limit, offset, search } = input

    const lessonRow = await payloadDb
      .select({
        id: lessons.id,
        title: lessons.title,
        slug: lessons.slug,
        type: lessons.type,
        courseId: courses.id,
        courseSlug: courses.slug,
        courseTitle: courses.title,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.module, modules.id))
      .innerJoin(courses, eq(modules.course, courses.id))
      .where(
        and(
          eq(lessons.slug, lessonSlug),
          eq(courses.slug, courseSlug),
          ne(lessons.isHidden, true),
          ne(modules.isHidden, true),
          ne(courses.isHidden, true),
        ),
      )
      .limit(1)

    const lesson = lessonRow[0]
    if (!lesson || !lesson.slug || !lesson.courseSlug) {
      throw new AppError(404, 'Lesson not found')
    }

    const lessonInfo = {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      type: lesson.type as 'lecture' | 'test' | 'coding_task' | 'review_task',
      courseSlug: lesson.courseSlug,
      courseTitle: lesson.courseTitle,
    }

    const userSearchFilter = buildSearchFilter(search, [user.name, user.email, user.username])

    if (lesson.type === 'coding_task') {
      const whereClause = buildWhereClause(
        eq(userLessons.lessonId, lesson.id),
        userSearchFilter,
      )
      const [{ total: totalRaw }] = await db
        .select({ total: count() })
        .from(codingTaskSubmissions)
        .innerJoin(userLessons, eq(codingTaskSubmissions.userLessonId, userLessons.id))
        .innerJoin(user, eq(userLessons.userId, user.id))
        .where(whereClause)

      const rows = await db
        .select({
          id: codingTaskSubmissions.id,
          submittedAt: codingTaskSubmissions.submittedAt,
          passed: codingTaskSubmissions.passed,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userImage: user.image,
          username: user.username,
        })
        .from(codingTaskSubmissions)
        .innerJoin(userLessons, eq(codingTaskSubmissions.userLessonId, userLessons.id))
        .innerJoin(user, eq(userLessons.userId, user.id))
        .where(whereClause)
        .orderBy(desc(codingTaskSubmissions.submittedAt))
        .limit(limit)
        .offset(offset)

      return {
        lesson: lessonInfo,
        total: Number(totalRaw ?? 0),
        items: rows.map((r) => ({
          id: String(r.id),
          kind: 'coding_task' as const,
          userId: r.userId,
          userName: r.userName,
          userEmail: r.userEmail,
          userImage: r.userImage,
          username: r.username,
          submittedAt: r.submittedAt.toISOString(),
          passed: r.passed,
          status: null as string | null,
        })),
      }
    }

    if (lesson.type === 'review_task') {
      const whereClause = buildWhereClause(
        eq(userLessons.lessonId, lesson.id),
        userSearchFilter,
      )
      const [{ total: totalRaw }] = await db
        .select({ total: count() })
        .from(projectUserSubmissions)
        .innerJoin(userLessons, eq(projectUserSubmissions.userLessonId, userLessons.id))
        .innerJoin(user, eq(userLessons.userId, user.id))
        .where(whereClause)

      const rows = await db
        .select({
          id: projectUserSubmissions.id,
          submittedAt: projectUserSubmissions.submittedAt,
          status: projectUserSubmissions.status,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userImage: user.image,
          username: user.username,
        })
        .from(projectUserSubmissions)
        .innerJoin(userLessons, eq(projectUserSubmissions.userLessonId, userLessons.id))
        .innerJoin(user, eq(userLessons.userId, user.id))
        .where(whereClause)
        .orderBy(desc(projectUserSubmissions.submittedAt))
        .limit(limit)
        .offset(offset)

      return {
        lesson: lessonInfo,
        total: Number(totalRaw ?? 0),
        items: rows.map((r) => ({
          id: String(r.id),
          kind: 'review_task' as const,
          userId: r.userId,
          userName: r.userName,
          userEmail: r.userEmail,
          userImage: r.userImage,
          username: r.username,
          submittedAt: r.submittedAt.toISOString(),
          passed: r.status === 'completed',
          status: r.status,
        })),
      }
    }

    // lecture or test — list completions from user_lessons
    const whereClause = buildWhereClause(
      eq(userLessons.lessonId, lesson.id),
      eq(userLessons.isCompleted, true),
      userSearchFilter,
    )
    const [{ total: totalRaw }] = await db
      .select({ total: count() })
      .from(userLessons)
      .innerJoin(user, eq(userLessons.userId, user.id))
      .where(whereClause)

    const rows = await db
      .select({
        id: userLessons.id,
        updatedAt: userLessons.updatedAt,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        username: user.username,
      })
      .from(userLessons)
      .innerJoin(user, eq(userLessons.userId, user.id))
      .where(whereClause)
      .orderBy(desc(userLessons.updatedAt))
      .limit(limit)
      .offset(offset)

    return {
      lesson: lessonInfo,
      total: Number(totalRaw ?? 0),
      items: rows.map((r) => ({
        id: String(r.id),
        kind: lesson.type as 'lecture' | 'test',
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        userImage: r.userImage,
        username: r.username,
        submittedAt: r.updatedAt.toISOString(),
        passed: true,
        status: null as string | null,
      })),
    }
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

    let codingTaskSubmissions: Awaited<ReturnType<typeof CodingTaskService.getSubmissionsForUserLessonAdmin>> = []
    if (lesson.type === 'coding_task' && userLesson?.id) {
      codingTaskSubmissions = await CodingTaskService.getSubmissionsForUserLessonAdmin(userLesson.id)
    }

    // Admin sees raw review feedback — no sanitization of hidden criteria
    let submissions: Awaited<ReturnType<typeof ReviewService.getSubmissionsForUserLessonAdmin>> = []
    if (lesson.type === 'review_task' && userLesson?.id) {
      submissions = await ReviewService.getSubmissionsForUserLessonAdmin(userLesson.id)
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
