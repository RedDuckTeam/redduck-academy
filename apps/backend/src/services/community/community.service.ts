import { sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { payloadDb } from '../../db'

export class CommunityService {
  static async listEvents() {
    return payloadDb.query.community_events.findMany({
      columns: {
        id: true,
        title: true,
        slug: true,
        description: true,
        eventDate: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        photo: {
          columns: { id: true, url: true, alt: true, width: true, height: true },
        },
      },
      orderBy: (ce, { desc: d }) => [sql`${ce.eventDate} DESC NULLS LAST`, d(ce.createdAt)],
    })
  }

  static async getEventBySlug(slug: string) {
    const event = await payloadDb.query.community_events.findFirst({
      where: (ce, { eq }) => eq(ce.slug, slug),
      with: {
        photo: {
          columns: { id: true, url: true, alt: true, width: true, height: true },
        },
      },
    })

    if (!event) {
      throw new HTTPException(404, { message: 'Community event not found' })
    }

    return event
  }
}
