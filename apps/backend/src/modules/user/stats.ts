import { createFactory } from 'hono/factory'
import { db } from '../../db'
import { eq, and, count } from 'drizzle-orm'
import { user } from '../../db/auth-schema'
import { userLessons } from '../../db/schema'
import { getUserStatsDesc } from '../../descriptions/user'

type UserEnv = { Variables: { user: { id: string }; session: unknown } }
const factory = createFactory<UserEnv>()

export const getUserStatsHandler = factory.createHandlers(getUserStatsDesc, async (c) => {
  const authUser = c.get('user')
  try {
    const [userRecord] = await db.select({ points: user.points }).from(user).where(eq(user.id, authUser.id)).limit(1)

    const [countResult] = await db
      .select({ count: count() })
      .from(userLessons)
      .where(and(eq(userLessons.userId, authUser.id), eq(userLessons.isCompleted, true)))

    const points = userRecord?.points ?? 0
    const completedLessonsCount = countResult?.count ?? 0

    return c.json({
      data: {
        points,
        completedLessonsCount,
      },
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return c.json({ error: 'Failed to fetch user stats' }, 500)
  }
})
