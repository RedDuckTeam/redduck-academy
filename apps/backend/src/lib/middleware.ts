import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { auth } from './auth'
import { AppError } from './errors'

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) {
    throw new AppError(401, 'Unauthorized')
  }
  c.set('user', session.user)
  c.set('session', session)
  await next()
})

export function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    ''
  )
}
