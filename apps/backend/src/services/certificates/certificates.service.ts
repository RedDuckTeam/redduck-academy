import { eq, and, inArray } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user, userCertificates, userLessons } from '../../db/schema'
import { payloadSchema } from '@redduck/payload-config'
import { AppError } from '../../lib/errors'

const { courses } = payloadSchema

function formatCert(r: typeof userCertificates.$inferSelect) {
  return {
    id: r.id,
    courseSlug: r.courseSlug,
    issuedAt: r.issuedAt.toISOString(),
    name: r.name,
    status: r.status,
    metadataUri: r.metadataUri ?? null,
    imageUrl: r.imageUrl ?? null,
    tokenId: r.tokenId ?? null,
    txHash: r.txHash ?? null,
  }
}

export class CertificatesService {
  static async claimCertificate(userId: string, courseSlug: string) {
    const [course, userRow] = await Promise.all([
      payloadDb.query.courses.findFirst({
        where: (c, { and, ne }) => and(eq(c.slug, courseSlug), ne(c.isHidden, true)),
        with: {
          modules: {
            where: (m, { ne }) => ne(m.isHidden, true),
            with: {
              lessons: {
                where: (l, { ne }) => ne(l.isHidden, true),
                columns: { id: true, type: true },
              },
            },
          },
        },
      }),
      db.query.user.findFirst({ where: eq(user.id, userId), columns: { name: true } }),
    ])

    if (!course) throw new AppError(404, 'Course not found')
    if (!userRow) throw new AppError(404, 'User not found')

    const name = userRow.name

    const existing = await db.query.userCertificates.findFirst({
      where: and(
        eq(userCertificates.userId, userId),
        eq(userCertificates.courseSlug, courseSlug),
        eq(userCertificates.name, name),
      ),
    })

    if (existing) return formatCert(existing)

    const allLessons = (course.modules ?? []).flatMap((m) => m.lessons ?? [])
    const gradedLessonIds = allLessons.filter((l) => l.type !== 'lecture').map((l) => l.id)

    if (gradedLessonIds.length > 0) {
      const completedRows = await db
        .select({ lessonId: userLessons.lessonId })
        .from(userLessons)
        .where(
          and(
            eq(userLessons.userId, userId),
            eq(userLessons.isCompleted, true),
            inArray(userLessons.lessonId, gradedLessonIds),
          ),
        )

      const completedIds = new Set(completedRows.map((r) => r.lessonId))
      if (!gradedLessonIds.every((id) => completedIds.has(id))) {
        throw new AppError(403, 'Not all lessons are completed')
      }
    }

    const [certificate] = await db
      .insert(userCertificates)
      .values({ userId, courseSlug, name, status: 'created' })
      .returning()

    return formatCert(certificate)
  }

  static async requestNft(userId: string, certificateId: string) {
    const cert = await db.query.userCertificates.findFirst({
      where: eq(userCertificates.id, certificateId),
    })

    if (!cert) throw new AppError(404, 'Certificate not found')
    if (cert.userId !== userId) throw new AppError(403, 'Forbidden')
    if (cert.status === 'claimed') throw new AppError(400, 'Certificate already claimed')

    const [updated] = await db
      .update(userCertificates)
      .set({ status: 'requested' })
      .where(eq(userCertificates.id, certificateId))
      .returning()

    return formatCert(updated)
  }

  static async adminMarkClaimed(
    certificateId: string,
    data: { metadataUri: string; imageUrl: string; tokenId: string; txHash?: string },
  ) {
    const cert = await db.query.userCertificates.findFirst({
      where: eq(userCertificates.id, certificateId),
    })

    if (!cert) throw new AppError(404, 'Certificate not found')

    const [updated] = await db
      .update(userCertificates)
      .set({
        status: 'claimed',
        metadataUri: data.metadataUri,
        imageUrl: data.imageUrl,
        tokenId: data.tokenId,
        txHash: data.txHash ?? null,
      })
      .where(eq(userCertificates.id, certificateId))
      .returning()

    return formatCert(updated)
  }

  static async getCertificateById(id: string) {
    const row = await db.query.userCertificates.findFirst({
      where: eq(userCertificates.id, id),
    })

    if (!row) throw new AppError(404, 'Certificate not found')

    const course = await payloadDb.query.courses.findFirst({
      where: eq(courses.slug, row.courseSlug),
      columns: { title: true },
    })

    return {
      ...formatCert(row),
      courseTitle: course?.title ?? row.courseSlug,
    }
  }

  static async getUserCertificates(userId: string) {
    const rows = await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.userId, userId))

    const slugs = [...new Set(rows.map((r) => r.courseSlug))]
    const courseRows = await payloadDb.query.courses.findMany({
      where: (c, { inArray }) => inArray(c.slug, slugs),
      columns: { slug: true, title: true },
    })
    const titleBySlug = Object.fromEntries(courseRows.map((c) => [c.slug, c.title]))

    return rows.map((r) => ({
      ...formatCert(r),
      courseTitle: titleBySlug[r.courseSlug] ?? r.courseSlug,
    }))
  }
}
