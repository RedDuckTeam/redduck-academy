import { and, asc, count, countDistinct, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import { user } from '../../db/auth-schema'
import { userLessons, userCertificates } from '../../db/schema'

export type AdminStats = {
  totalUsers: number
  totalLessonCompletions: number
  averageLessonsPerUser: number
  activeLearners: number
  totalCertificates: number
}

export type AdminUserRow = {
  email: string
  name: string
  isPrivate: boolean
  lessonsPassed: number
  coursesPassed: number
}

export type AdminCertificateRow = {
  id: string
  userId: string
  userEmail: string
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

  static async getUsersPage(input: { limit: number; offset: number }): Promise<{
    rows: AdminUserRow[]
    total: number
  }> {
    const [{ total: totalRaw }] = await db.select({ total: count() }).from(user)
    const total = Number(totalRaw ?? 0)

    const pageUsers = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        isPrivate: user.isPrivate,
      })
      .from(user)
      .orderBy(asc(user.email))
      .limit(input.limit)
      .offset(input.offset)

    if (pageUsers.length === 0) {
      return { rows: [], total }
    }

    const ids = pageUsers.map((u) => u.id)

    const [lessonAgg, certAgg] = await Promise.all([
      db
        .select({
          userId: userLessons.userId,
          n: count(),
        })
        .from(userLessons)
        .where(and(inArray(userLessons.userId, ids), eq(userLessons.isCompleted, true)))
        .groupBy(userLessons.userId),
      db
        .select({
          userId: userCertificates.userId,
          n: count(),
        })
        .from(userCertificates)
        .where(inArray(userCertificates.userId, ids))
        .groupBy(userCertificates.userId),
    ])

    const lessonMap = new Map(lessonAgg.map((r) => [r.userId, Number(r.n)]))
    const certMap = new Map(certAgg.map((r) => [r.userId, Number(r.n)]))

    const rows: AdminUserRow[] = pageUsers.map((u) => ({
      email: u.email,
      name: u.name,
      isPrivate: u.isPrivate,
      lessonsPassed: lessonMap.get(u.id) ?? 0,
      coursesPassed: certMap.get(u.id) ?? 0,
    }))

    return { rows, total }
  }

  static async getCertificatesPage(input: { limit: number; offset: number }): Promise<{
    rows: AdminCertificateRow[]
    total: number
  }> {
    const [{ total: totalRaw }] = await db.select({ total: count() }).from(userCertificates)
    const total = Number(totalRaw ?? 0)

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
      .orderBy(
        asc(sql`CASE WHEN ${userCertificates.status} = 'requested' THEN 0 ELSE 1 END`),
        desc(userCertificates.issuedAt),
      )
      .limit(input.limit)
      .offset(input.offset)

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
}
