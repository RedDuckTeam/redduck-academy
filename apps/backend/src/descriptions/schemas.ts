import { resolver } from 'hono-openapi'
import { z } from 'zod'

export const errorSchema = resolver(z.object({ error: z.string() }))
