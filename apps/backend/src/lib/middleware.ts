import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { auth } from './auth'
import { AppError } from './errors'
import { db } from '../db'
import { user } from '../db/auth-schema'

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) {
    throw new AppError(401, 'Unauthorized')
  }
  c.set('user', session.user)
  c.set('session', session)
  await next()
})

export const requireAdmin = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) {
    throw new AppError(401, 'Unauthorized')
  }
  c.set('user', session.user)
  c.set('session', session)

  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (row?.role !== 'admin') {
    throw new AppError(403, 'Forbidden')
  }

  await next()
})

export function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    ''
  )
}
