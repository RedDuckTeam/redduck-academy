import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { requireAuth } from '../../lib/middleware'
import type { AuthVariables } from '../../lib/types'
import {
  claimCertificateDesc,
  claimCertificateBodySchema,
  getCertificateByIdDesc,
  getUserCertificatesDesc,
} from '../../descriptions/certificates'
import { CertificatesService } from './certificates.service'

const certificatesApp = new Hono<{ Variables: AuthVariables }>()

certificatesApp.get('/:id', getCertificateByIdDesc, async (c) => {
  const data = await CertificatesService.getCertificateById(c.req.param('id'))
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
  validator('json', claimCertificateBodySchema),
  async (c) => {
    const authUser = c.get('user')
    const courseSlug = c.req.param('courseSlug')
    const { name } = c.req.valid('json')
    const data = await CertificatesService.claimCertificate(authUser.id, courseSlug, name)
    return c.json({ data })
  },
)

export type CertificatesAppType = typeof certificatesApp

export default certificatesApp
