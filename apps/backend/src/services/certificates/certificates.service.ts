import { eq, and, inArray } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { userCertificates, userLessons } from '../../db/schema'
import { payloadSchema } from '@redduck/payload-config'
import { AppError } from '../../lib/errors'

const { courses } = payloadSchema

export class CertificatesService {
  static async claimCertificate(userId: string, courseSlug: string, name: string) {
    const course = await payloadDb.query.courses.findFirst({
      where: eq(courses.slug, courseSlug),
      with: {
        modules: {
          with: {
            lessons: {
              columns: { id: true, type: true },
            },
          },
        },
      },
    })

    if (!course) {
      throw new AppError(404, 'Course not found')
    }

    const existing = await db.query.userCertificates.findFirst({
      where: and(
        eq(userCertificates.userId, userId),
        eq(userCertificates.courseSlug, courseSlug),
      ),
    })

    if (existing) {
      throw new AppError(409, 'Certificate already claimed')
    }

    const allLessons = (course.modules ?? []).flatMap((m) => m.lessons ?? [])
    const gradedLessonIds = allLessons
      .filter((l) => l.type !== 'lecture')
      .map((l) => l.id)

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
      const allCompleted = gradedLessonIds.every((id) => completedIds.has(id))

      if (!allCompleted) {
        throw new AppError(403, 'Not all lessons are completed')
      }
    }

    const [certificate] = await db
      .insert(userCertificates)
      .values({ userId, courseSlug, name })
      .returning()

    return {
      id: certificate.id,
      courseSlug: certificate.courseSlug,
      issuedAt: certificate.issuedAt.toISOString(),
      name: certificate.name,
    }
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
      id: row.id,
      courseSlug: row.courseSlug,
      courseTitle: course?.title ?? row.courseSlug,
      issuedAt: row.issuedAt.toISOString(),
      name: row.name,
    }
  }

  static async getUserCertificates(userId: string) {
    const rows = await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.userId, userId))

    return rows.map((r) => ({
      id: r.id,
      courseSlug: r.courseSlug,
      issuedAt: r.issuedAt.toISOString(),
      name: r.name,
    }))
  }
}
