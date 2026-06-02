import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { requireAuth, requireAdmin } from '../../lib/middleware'
import type { AuthVariables } from '../../lib/types'
import {
  claimCertificateDesc,
  claimCertificateBodySchema,
  getCertificateByIdDesc,
  getUserCertificatesDesc,
  adminGenerateCertificateDesc,
  adminGenerateCertificateBodySchema,
  requestNftDesc,
  requestNftBodySchema,
  adminMarkClaimedDesc,
  adminMarkClaimedBodySchema,
  certificateIdParamSchema,
  certificateHumanIdParamSchema,
  certificateCourseSlugParamSchema,
} from '../../descriptions/certificates'
import { CertificatesService } from './certificates.service'
import { CertificateGenerationService } from './certificate-generation.service'
import { AppError } from '../../lib/errors'

const certificatesApp = new Hono<{ Variables: AuthVariables }>()

certificatesApp.post(
  '/admin/generate',
  requireAdmin,
  adminGenerateCertificateDesc,
  validator('json', adminGenerateCertificateBodySchema),
  async (c) => {
    const { userId, courseSlug, imageDataUrl } = c.req.valid('json')
    let image: { buffer: Buffer; contentType: 'image/jpeg' | 'image/png' } | undefined
    if (imageDataUrl) {
      const match = imageDataUrl.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/)
      if (!match) throw new AppError(400, 'imageDataUrl must be a base64 image/jpeg or image/png data URL')
      const buffer = Buffer.from(match[2], 'base64')
      if (buffer.length === 0) throw new AppError(400, 'Image is empty')
      image = { buffer, contentType: match[1] as 'image/jpeg' | 'image/png' }
    }
    const data = await CertificateGenerationService.generateCertificateAssets(userId, courseSlug, image)
    return c.json({ data })
  },
)

certificatesApp.post(
  '/admin/:id/claim',
  requireAdmin,
  adminMarkClaimedDesc,
  validator('param', certificateIdParamSchema),
  validator('json', adminMarkClaimedBodySchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const data = await CertificatesService.adminMarkClaimed(id, body)
    return c.json({ data })
  },
)

// NOT cached: the response carries owner-mutable state (`status` created→requested→claimed,
// `walletAddress`) that changes the moment the owner requests/claims the NFT. Route caching has
// no invalidation, so the owner would see stale status for up to the TTL right after acting.
certificatesApp.get('/:id', getCertificateByIdDesc, validator('param', certificateHumanIdParamSchema), async (c) => {
  const { id } = c.req.valid('param')
  const data = await CertificatesService.getCertificateByHumanId(id)
  return c.json({ data })
})

// TODO: CACHE (user-scoped ONLY) post-deploy — per-user list; do NOT route-cache (URL has no userId → cross-user leak).
// Service layer keyed by userId, invalidate on claim/request-nft. cache 300s / staleWhileRevalidate 60s.
certificatesApp.get('/', requireAuth, getUserCertificatesDesc, async (c) => {
  const authUser = c.get('user')
  const data = await CertificatesService.getUserCertificates(authUser.id)
  return c.json({ data })
})

certificatesApp.post(
  '/:courseSlug/claim',
  requireAuth,
  claimCertificateDesc,
  validator('param', certificateCourseSlugParamSchema),
  validator('json', claimCertificateBodySchema),
  async (c) => {
    const authUser = c.get('user')
    const { courseSlug } = c.req.valid('param')
    void c.req.valid('json')
    const data = await CertificatesService.claimCertificate(authUser.id, courseSlug)
    return c.json({ data })
  },
)

certificatesApp.post(
  '/:id/request-nft',
  requireAuth,
  requestNftDesc,
  validator('param', certificateIdParamSchema),
  validator('json', requestNftBodySchema),
  async (c) => {
    const authUser = c.get('user')
    const privyUserId = c.get('privyUserId')
    const { id } = c.req.valid('param')
    const { walletAddress } = c.req.valid('json')
    const data = await CertificatesService.requestNft(authUser.id, id, walletAddress, privyUserId)
    return c.json({ data })
  },
)

export type CertificatesAppType = typeof certificatesApp

export default certificatesApp
