import { Hono } from 'hono'
import { requireAuth } from '../lib/middleware'
import { getUserStatsHandler } from '../modules/user/stats'

type UserVariables = {
  user: { id: string }
  session: unknown
}

const userApp = new Hono<{ Variables: UserVariables }>()

userApp.get('/stats', requireAuth, ...getUserStatsHandler)

export type UserAppType = typeof userApp

export default userApp
