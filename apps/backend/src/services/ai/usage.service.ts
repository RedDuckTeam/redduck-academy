import { db } from '../../db'
import { aiUsageLogs } from '../../db/schema'
import { Logger } from '../../lib/logger'
import { computeCostUsd, PRICING_VERSION } from './pricing'

const logger = new Logger('AiUsageService')

export type AiSubmissionType = 'project' | 'coding_task' | 'coding_task_recheck'

export interface NormalizedUsage {
  promptTokens: number
  cachedTokens: number
  completionTokens: number
  totalTokens: number
}

/**
 * Normalizes an OpenAI `usage` object into our shape. Accepts `unknown` so it works for both
 * the typed SDK response (sync calls) and JSON parsed from Batch API output (snake_case at runtime).
 * Returns null when there's nothing usable to record.
 */
export function normalizeUsage(raw: unknown): NormalizedUsage | null {
  if (typeof raw !== 'object' || raw === null) return null
  const u = raw as Record<string, unknown>
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

  const details = u.prompt_tokens_details
  const cachedTokens =
    typeof details === 'object' && details !== null ? num((details as Record<string, unknown>).cached_tokens) : 0

  return {
    promptTokens: num(u.prompt_tokens),
    cachedTokens,
    completionTokens: num(u.completion_tokens),
    totalTokens: num(u.total_tokens),
  }
}

/**
 * Normalizes an Anthropic `usage` object into our shape. Anthropic reports uncached input, cache
 * reads, and cache writes as separate counts, so `promptTokens` is their sum (to satisfy
 * computeCostUsd's "promptTokens includes cached" contract) and `cachedTokens` is the cache-read
 * portion. Accepts `unknown` so it works for both the typed SDK response and JSON from batch output.
 */
export function normalizeAnthropicUsage(raw: unknown): NormalizedUsage | null {
  if (typeof raw !== 'object' || raw === null) return null
  const u = raw as Record<string, unknown>
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

  const inputTokens = num(u.input_tokens)
  const cacheRead = num(u.cache_read_input_tokens)
  const cacheCreation = num(u.cache_creation_input_tokens)
  const outputTokens = num(u.output_tokens)
  const promptTokens = inputTokens + cacheRead + cacheCreation

  return {
    promptTokens,
    cachedTokens: cacheRead,
    completionTokens: outputTokens,
    totalTokens: promptTokens + outputTokens,
  }
}

/**
 * Records one LLM call's token usage + estimated cost. Best-effort: a logging failure must never
 * break the review that produced it, so all errors are swallowed (and logged). No-ops when usage
 * is missing.
 */
export async function recordAiUsage(input: {
  userId: string | null
  lessonId: number | null
  userLessonId: number | null
  submissionType: AiSubmissionType
  submissionId: number | null
  model: string
  isBatch: boolean
  usage: NormalizedUsage | null
  batchRequestId?: string | null
}): Promise<void> {
  if (!input.usage) {
    logger.error('No usage to record for AI call', undefined, {
      submissionType: input.submissionType,
      submissionId: input.submissionId,
      model: input.model,
    })
    return
  }

  try {
    const costUsd = computeCostUsd({
      model: input.model,
      promptTokens: input.usage.promptTokens,
      cachedTokens: input.usage.cachedTokens,
      completionTokens: input.usage.completionTokens,
      isBatch: input.isBatch,
    })

    await db.insert(aiUsageLogs).values({
      userId: input.userId,
      lessonId: input.lessonId,
      userLessonId: input.userLessonId,
      submissionType: input.submissionType,
      submissionId: input.submissionId,
      model: input.model,
      isBatch: input.isBatch,
      promptTokens: input.usage.promptTokens,
      cachedTokens: input.usage.cachedTokens,
      completionTokens: input.usage.completionTokens,
      totalTokens: input.usage.totalTokens,
      costUsd: costUsd.toFixed(6),
      pricingVersion: PRICING_VERSION,
      batchRequestId: input.batchRequestId ?? null,
    })
  } catch (err) {
    logger.error('Failed to record AI usage', err, {
      submissionType: input.submissionType,
      submissionId: input.submissionId,
      model: input.model,
    })
  }
}
