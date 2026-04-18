import { createHash } from 'crypto'
import { eq, and, inArray } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user, walletAddress, userLessons } from '../../db/schema'
import { uploadToR2, getJsonFromR2 } from '../../lib/r2'
import { AppError } from '../../lib/errors'
import { getBrowser } from '../../lib/browser'
import { buildCertificateHtml } from './template'
import { payloadSchema } from '@redduck/payload-config'

const { courses } = payloadSchema

interface CertificateManifest {
  name: string
  imageUrl: string
  metadataUri: string
  contentHash: string
}

export interface GenerateCertificateResult {
  metadataUri: string
  contentHash: string
  walletAddress: string
  imageUrl: string
}

async function renderCertificateImage(
  userName: string,
  courseTitle: string,
  issuedAt: Date,
): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 960, height: 540 })
    await page.setContent(buildCertificateHtml(userName, courseTitle, issuedAt), {
      waitUntil: 'networkidle0',
    })
    return Buffer.from(await page.screenshot({ type: 'jpeg', quality: 85, fullPage: false }))
  } finally {
    await page.close()
  }
}

export class CertificateGenerationService {
  static async generateCertificateAssets(
    userId: string,
    courseSlug: string,
  ): Promise<GenerateCertificateResult> {
    const [userRow, wallet, course] = await Promise.all([
      db.query.user.findFirst({ where: eq(user.id, userId) }),
      db.query.walletAddress.findFirst({
        where: and(eq(walletAddress.userId, userId), eq(walletAddress.isPrimary, true)),
      }),
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
    ])

    if (!userRow) throw new AppError(404, 'User not found')
    if (!wallet) throw new AppError(400, 'User has no primary wallet connected')
    if (!course) throw new AppError(404, 'Course not found')

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

    const userName = userRow.name
    const courseTitle = course.title as string
    const certKey = createHash('sha256').update(`${userId}:${courseSlug}`).digest('base64url').slice(0, 24)
    const base = `certificates/${certKey}`
    const manifestKey = `${base}/manifest.json`

    const existingManifest = await getJsonFromR2<CertificateManifest>(manifestKey)
    if (existingManifest && existingManifest.name === userName) {
      return {
        metadataUri: existingManifest.metadataUri,
        contentHash: existingManifest.contentHash,
        walletAddress: wallet.address,
        imageUrl: existingManifest.imageUrl,
      }
    }

    const issuedAt = new Date()
    const imageBuffer = await renderCertificateImage(userName, courseTitle, issuedAt)
    const contentHash = '0x' + createHash('sha256')
      .update(`${userName}:${courseTitle}:${wallet.address}`)
      .digest('hex')

    const noCache = 'no-cache, no-store, must-revalidate'
    const imageUrl = await uploadToR2(`${base}/preview.jpg`, imageBuffer, 'image/jpeg', noCache)

    const metadata = {
      name: `${courseTitle} — Course Certificate`,
      description: `Awarded to ${userName} for completing ${courseTitle} on RedDuck Academy.`,
      image: imageUrl,
      external_url: `https://redduck.academy/certificates/${courseSlug}`,
      attributes: [
        { trait_type: 'Course', value: courseTitle },
        { trait_type: 'Recipient', value: userName },
        { trait_type: 'Issued At', display_type: 'date', value: Math.floor(issuedAt.getTime() / 1000) },
      ],
    }

    const metadataUri = await uploadToR2(
      `${base}/metadata.json`,
      Buffer.from(JSON.stringify(metadata, null, 2)),
      'application/json',
      noCache,
    )

    const manifest: CertificateManifest = { name: userName, imageUrl, metadataUri, contentHash }
    await uploadToR2(manifestKey, Buffer.from(JSON.stringify(manifest)), 'application/json', noCache)

    return { metadataUri, contentHash, walletAddress: wallet.address, imageUrl }
  }
}
