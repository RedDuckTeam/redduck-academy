import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { verifyPrivyToken } from './privy'
import { ensureAppUser } from './ensure-app-user'
import { AppError } from './errors'
import { Logger } from './logger'
import { db } from '../db'
import { user } from '../db/auth-schema'

const logger = new Logger('AuthMiddleware')

function extractBearerToken(c: Context): string | null {
  const header = c.req.header('Authorization') ?? c.req.header('authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ', 2)
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

async function resolveUser(c: Context): Promise<{ id: string; idToken: string; privyUserId: string }> {
  const token = extractBearerToken(c)

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

/**
 * Resolves a session when one is offered, and lets the request through when none is.
 *
 * For routes open to visitors without an account, where being signed in changes how the request is
 * treated rather than whether it is allowed. A *malformed or expired* token is still a 401 — a
 * stale session must surface as something the client can refresh, not silently downgrade the
 * caller to anonymous and hand them a captcha they cannot explain.
 */
export const optionalAuth = createMiddleware(async (c, next) => {
  if (extractBearerToken(c) === null) {
    await next()
    return
  }
  const resolved = await resolveUser(c)
  c.set('user', { id: resolved.id })
  c.set('idToken', resolved.idToken)
  c.set('privyUserId', resolved.privyUserId)
  await next()
})

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

