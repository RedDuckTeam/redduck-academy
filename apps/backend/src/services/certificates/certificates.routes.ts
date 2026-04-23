import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { requireAuth } from '../../lib/middleware'
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
  certificateCourseSlugParamSchema,
} from '../../descriptions/certificates'
import { CertificatesService } from './certificates.service'
import { CertificateGenerationService } from './certificate-generation.service'

const certificatesApp = new Hono<{ Variables: AuthVariables }>()

certificatesApp.post(
  '/admin/generate',
  adminGenerateCertificateDesc,
  validator('json', adminGenerateCertificateBodySchema),
  async (c) => {
    const { userId, courseSlug } = c.req.valid('json')
    const data = await CertificateGenerationService.generateCertificateAssets(userId, courseSlug)
    return c.json({ data })
  },
)

certificatesApp.post(
  '/admin/:id/claim',
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

certificatesApp.get('/:id', getCertificateByIdDesc, validator('param', certificateIdParamSchema), async (c) => {
  const { id } = c.req.valid('param')
  const data = await CertificatesService.getCertificateById(id)
  return c.json({ data })
})

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
