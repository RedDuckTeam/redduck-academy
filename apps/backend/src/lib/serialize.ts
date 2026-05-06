import type { z } from 'zod'
import { AppError, GENERIC_ERROR_MESSAGE } from './errors'
import { Logger } from './logger'

const logger = new Logger('Serialize')

/**
 * Parse `data` against `schema` before returning it from a route handler.
 * Drops unexpected fields when the schema is `strip` (Zod default) and throws
 * on shape mismatches — surfacing them as a 500 with the generic message
 * instead of leaking the raw object.
 */
export function serializeOrThrow<S extends z.ZodTypeAny>(schema: S, data: unknown, context: string): z.output<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    logger.error(`Response shape mismatch in ${context}`, result.error, {
      issues: result.error.issues,
    })
    throw new AppError(500, GENERIC_ERROR_MESSAGE)
  }
  return result.data
}
