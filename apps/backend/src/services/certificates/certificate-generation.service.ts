import { createHash } from 'crypto'
import { keccak256, toBytes } from 'viem'
import { eq, and, inArray } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { userLessons, userCertificates } from '../../db/schema'
import { uploadToR2, getJsonFromR2 } from '../../lib/r2'
import { AppError } from '../../lib/errors'

interface CertificateManifest {
  name: string
  humanId: string
  imageUrl: string
  metadataUri: string
  metadataHash: string
}

interface CertContext {
  certKey: string
  userName: string
  humanId: string
  courseTitle: string
  walletAddr: string
  courseId: number
  certificateId: string | null
}

interface MintParams {
  state: 'ready'
  certificateId: string | null
  metadataUri: string
  metadataHash: string
  walletAddress: string
  imageUrl: string
  courseId: number
}

interface NeedsImage {
  state: 'needs-image'
  certificateId: string | null
  walletAddress: string
  courseId: number
  userName: string
  humanId: string
  courseTitle: string
}

export type GenerateCertificateResult = MintParams | NeedsImage

async function resolveCertContext(userId: string, courseSlug: string): Promise<CertContext> {
  const [course, certificate] = await Promise.all([
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
    db.query.userCertificates.findFirst({
      where: and(eq(userCertificates.userId, userId), eq(userCertificates.courseSlug, courseSlug)),
      columns: { id: true, humanId: true, walletAddress: true, name: true },
      orderBy: (c, { desc }) => desc(c.issuedAt),
    }),
  ])

  if (!course) throw new AppError(404, 'Course not found')
  if (!certificate?.walletAddress) {
    throw new AppError(400, 'Certificate has no target wallet — user must request NFT first')
  }

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
      throw new AppError(403, 'User has not completed all lessons in the course')
    }
  }

  return {
    certKey: createHash('sha256').update(`${userId}:${courseSlug}`).digest('base64url').slice(0, 24),
    userName: certificate.name,
    humanId: certificate.humanId,
    courseTitle: course.title as string,
    walletAddr: certificate.walletAddress,
    courseId: course.id as number,
    certificateId: certificate.id ?? null,
  }
}

function cachedMintParams(ctx: CertContext, manifest: CertificateManifest): MintParams {
  return {
    state: 'ready',
    certificateId: ctx.certificateId,
    metadataUri: manifest.metadataUri,
    metadataHash: manifest.metadataHash,
    walletAddress: ctx.walletAddr,
    imageUrl: manifest.imageUrl,
    courseId: ctx.courseId,
  }
}

export class CertificateGenerationService {
  static async generateCertificateAssets(
    userId: string,
    courseSlug: string,
    image?: { buffer: Buffer; contentType: 'image/jpeg' | 'image/png' },
  ): Promise<GenerateCertificateResult> {
    const ctx = await resolveCertContext(userId, courseSlug)
    const base = `certificates/${ctx.certKey}`
    const manifestKey = `${base}/manifest.json`

    const existing = await getJsonFromR2<CertificateManifest>(manifestKey)
    if (existing && existing.name === ctx.userName && existing.humanId === ctx.humanId) {
      return cachedMintParams(ctx, existing)
    }

    if (!image) {
      return {
        state: 'needs-image',
        certificateId: ctx.certificateId,
        walletAddress: ctx.walletAddr,
        courseId: ctx.courseId,
        userName: ctx.userName,
        humanId: ctx.humanId,
        courseTitle: ctx.courseTitle,
      }
    }

    const issuedAt = new Date()
    const imageExt = image.contentType === 'image/png' ? 'png' : 'jpg'
    const imageSuffix = createHash('sha256').update(image.buffer).digest('hex').slice(0, 8)
    const noCache = 'no-cache, no-store, must-revalidate'
    const imageUrl = await uploadToR2(`${base}/preview-${imageSuffix}.${imageExt}`, image.buffer, image.contentType)

    const metadata = {
      name: `${ctx.courseTitle} - RedDuck course certificate`,
      description: `Awarded to ${ctx.walletAddr} for completing ${ctx.courseTitle} course on RedDuck Academy.`,
      image: imageUrl,
      external_url: `https://redduck.academy/certificates/${ctx.humanId}`,
      attributes: [
        { trait_type: 'Course', value: ctx.courseTitle },
        { trait_type: 'Recipient', value: ctx.userName },
        { trait_type: 'Issued At', display_type: 'date', value: Math.floor(issuedAt.getTime() / 1000) },
      ],
    }

    const metadataJson = JSON.stringify(metadata, null, 2)
    const metadataHash = keccak256(toBytes(metadataJson))

    const metadataUri = await uploadToR2(
      `${base}/metadata.json`,
      Buffer.from(metadataJson),
      'application/json',
      noCache,
    )

    const manifest: CertificateManifest = {
      name: ctx.userName,
      humanId: ctx.humanId,
      imageUrl,
      metadataUri,
      metadataHash,
    }
    await uploadToR2(manifestKey, Buffer.from(JSON.stringify(manifest)), 'application/json', noCache)

    return {
      state: 'ready',
      certificateId: ctx.certificateId,
      metadataUri,
      metadataHash,
      walletAddress: ctx.walletAddr,
      imageUrl,
      courseId: ctx.courseId,
    }
  }
}
