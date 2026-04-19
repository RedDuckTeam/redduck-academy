import { describeRoute } from 'hono-openapi'

export const adminHealthDesc = describeRoute({
  summary: 'Admin health check',
  tags: ['Admin'],
  responses: {
    200: { description: 'OK' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
})
