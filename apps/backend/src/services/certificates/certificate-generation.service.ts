import { createHash } from 'crypto'
import { keccak256, toBytes } from 'viem'
import { eq, and, inArray } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { userLessons, userCertificates } from '../../db/schema'
import { uploadToR2, getJsonFromR2 } from '../../lib/r2'
import { AppError, GENERIC_ERROR_MESSAGE } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { getBrowser } from '../../lib/browser'
import { buildCertificateHtml } from './template'
import { payloadSchema } from '@redduck/payload-config'

const logger = new Logger('CertificateGenerationService')

const { courses } = payloadSchema

interface CertificateManifest {
  name: string
  imageUrl: string
  metadataUri: string
  metadataHash: string
}

export interface GenerateCertificateResult {
  certificateId: string | null
  metadataUri: string
  metadataHash: string
  walletAddress: string
  imageUrl: string
  courseId: number
}

async function renderCertificateImage(
  userName: string,
  courseTitle: string,
  issuedAt: Date,
): Promise<Buffer> {
  let browser
  try {
    browser = await getBrowser()
  } catch (err) {
    logger.error('Failed to launch Puppeteer browser', err)
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 960, height: 960 })
    await page.setContent(buildCertificateHtml(userName, courseTitle, issuedAt), {
      waitUntil: 'networkidle0',
    })
    return Buffer.from(await page.screenshot({ type: 'jpeg', quality: 85, fullPage: false }))
  } catch (err) {
    logger.error('Failed to render certificate image', err, { userName, courseTitle })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  } finally {
    await page.close()
  }
}

export class CertificateGenerationService {
  static async generateCertificateAssets(
    userId: string,
    courseSlug: string,
  ): Promise<GenerateCertificateResult> {
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
        columns: { id: true, walletAddress: true, name: true },
        orderBy: (c, { desc }) => desc(c.issuedAt),
      }),
    ])

    if (!course) throw new AppError(404, 'Course not found')
    if (!certificate?.walletAddress) {
      throw new AppError(400, 'Certificate has no target wallet — user must request NFT first')
    }

    const walletAddr = certificate.walletAddress

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

    const userName = certificate.name
    const courseTitle = course.title as string
    const certKey = createHash('sha256').update(`${userId}:${courseSlug}`).digest('base64url').slice(0, 24)
    const base = `certificates/${certKey}`
    const manifestKey = `${base}/manifest.json`

    const existingManifest = await getJsonFromR2<CertificateManifest>(manifestKey)
    if (existingManifest && existingManifest.name === userName) {
      return {
        certificateId: certificate?.id ?? null,
        metadataUri: existingManifest.metadataUri,
        metadataHash: existingManifest.metadataHash,
        walletAddress: walletAddr,
        imageUrl: existingManifest.imageUrl,
        courseId: course.id as number,
      }
    }

    const issuedAt = new Date()
    const imageBuffer = await renderCertificateImage(userName, courseTitle, issuedAt)
    const imageSuffix = createHash('sha256').update(imageBuffer).digest('hex').slice(0, 8)

    const noCache = 'no-cache, no-store, must-revalidate'
    const imageUrl = await uploadToR2(`${base}/preview-${imageSuffix}.jpg`, imageBuffer, 'image/jpeg')

    const metadata = {
      name: `${courseTitle} - RedDuck course certificate`,
      description: `Awarded to ${walletAddr} for completing ${courseTitle} course on RedDuck Academy.`,
      image: imageUrl,
      external_url: certificate ? `https://redduck.academy/certificates/${certificate.id}` : `https://redduck.academy/certificates/${courseSlug}`,
      attributes: [
        { trait_type: 'Course', value: courseTitle },
        { trait_type: 'Recipient', value: userName },
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

    const manifest: CertificateManifest = { name: userName, imageUrl, metadataUri, metadataHash }
    await uploadToR2(manifestKey, Buffer.from(JSON.stringify(manifest)), 'application/json', noCache)

    return { certificateId: certificate?.id ?? null, metadataUri, metadataHash, walletAddress: walletAddr, imageUrl, courseId: course.id as number }
  }
}
