import { env } from '../../env'
import { OpenAiProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import type { AiProvider } from './provider'

export type {
  AiProvider,
  AiProviderName,
  StructuredSchema,
  StructuredChatRequest,
  StructuredChatResult,
  BatchCreateRequest,
  BatchPollResult,
} from './provider'

let cached: AiProvider | null = null

/**
 * Returns the configured AI provider (a singleton). Routes to Anthropic when `AI_PROVIDER=anthropic`,
 * otherwise OpenAI. The concrete provider throws if its API key is missing, so a misconfigured switch
 * fails loudly on first use rather than silently degrading.
 */
export function getAiProvider(): AiProvider {
  if (cached) return cached
  cached = env.AI_PROVIDER === 'anthropic' ? new AnthropicProvider() : new OpenAiProvider()
  return cached
}
