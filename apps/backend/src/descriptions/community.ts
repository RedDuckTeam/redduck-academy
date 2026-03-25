import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

export const listCommunityDesc = describeRoute({
  summary: 'List community events',
  description: 'Returns community events for the home carousel (title, slug, description, optional event date, photo).',
  tags: ['Community'],
  responses: {
    200: {
      description: 'Community events',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.array(z.any()) })),
        },
      },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getCommunityEventDesc = describeRoute({
  summary: 'Get community event by slug',
  description: 'Returns a single community event including rich text content and photo.',
  tags: ['Community'],
  responses: {
    200: {
      description: 'Community event',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.any() })),
        },
      },
    },
    404: {
      description: 'Event not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})
