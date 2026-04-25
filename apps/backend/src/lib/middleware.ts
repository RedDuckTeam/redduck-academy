import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { verifyPrivyToken } from './privy'
import { ensureAppUser } from './ensure-app-user'
import { AppError } from './errors'
import { Logger } from './logger'
import { db } from '../db'
import { user } from '../db/auth-schema'

const logger = new Logger('AuthMiddleware')

async function resolveUser(c: Context): Promise<{ id: string; idToken: string; privyUserId: string }> {
  const token = getCookie(c, 'privy-token')

  if (!token) {
    throw new AppError(401, 'Unauthorized')
  }

  let claims
  try {
    claims = await verifyPrivyToken(token)
  } catch (err) {
    logger.error('Privy token verification failed', err, { path: c.req.path })
    throw new AppError(401, 'Unauthorized')
  }

  const appUser = await ensureAppUser(claims.userId)
  return { id: appUser.id, idToken: token, privyUserId: claims.userId }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const resolved = await resolveUser(c)
  c.set('user', { id: resolved.id })
  c.set('idToken', resolved.idToken)
  c.set('privyUserId', resolved.privyUserId)
  await next()
})

export const requireAdmin = createMiddleware(async (c, next) => {
  const resolved = await resolveUser(c)

  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, resolved.id)).limit(1)

  if (row?.role !== 'admin') throw new AppError(403, 'Forbidden')

  c.set('user', { id: resolved.id })
  c.set('idToken', resolved.idToken)
  c.set('privyUserId', resolved.privyUserId)
  await next()
})

export const requireNotBanned = createMiddleware(async (c, next) => {
  const authUser = c.get('user')
  if (!authUser) throw new AppError(401, 'Unauthorized')
  const [row] = await db.select({ blacklisted: user.blacklisted }).from(user).where(eq(user.id, authUser.id)).limit(1)
  if (row?.blacklisted) throw new AppError(403, 'Your account has been suspended. Please contact support.')
  await next()
})

export function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? ''
}
