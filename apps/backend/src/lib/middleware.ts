import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { verifyPrivyToken } from './privy'
import { ensureAppUser } from './ensure-app-user'
import { AppError } from './errors'
import { db } from '../db'
import { user } from '../db/auth-schema'

async function resolveUser(c: Context): Promise<{ id: string; idToken: string; privyUserId: string }> {
  const token = getCookie(c, 'privy-token')
  const cookieHeader = c.req.header('cookie')
  const origin = c.req.header('origin')
  const path = c.req.path

  if (!token) {
    throw new AppError(401, 'Unauthorized')
  }

  let claims
  try {
    claims = await verifyPrivyToken(token)
  } catch (err) {
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

export function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? ''
}
