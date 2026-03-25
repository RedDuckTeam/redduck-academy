import { env } from '../../env'
import { OpenAiAiClient } from './openai-client'
import type { AiClient } from './types'

export type { AiClient, ChatMessage, ChatParams, ChatResult } from './types'
export { OpenAiAiClient } from './openai-client'

/**
 * Returns an OpenAI-backed client. Throws if OPENAI_API_KEY is missing.
 */
export function createAiClient(): AiClient {
  const key = env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return new OpenAiAiClient(key)
}
