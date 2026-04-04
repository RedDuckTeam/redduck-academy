import { createMiddleware } from 'hono/factory'
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
