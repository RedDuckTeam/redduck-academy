import { describeRoute } from 'hono-openapi'

export const healthCheckDesc = describeRoute({
  summary: 'Health check',
  description:
    'Returns a simple greeting. Use to verify the API is running.',
  responses: {
    200: {
      description: 'API is running',
      content: {
        'text/plain': {
          schema: { type: 'string', example: 'Hello Hono!' },
        },
      },
    },
  },
})
