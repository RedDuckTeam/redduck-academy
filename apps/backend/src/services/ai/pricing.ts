/**
 * OpenAI token pricing, in USD per 1,000,000 tokens.
 *
 * ⚠️ These rates are hardcoded snapshots — verify against current OpenAI pricing
 * (https://openai.com/api/pricing) and bump PRICING_VERSION whenever you change them.
 * Stored `costUsd` is only an estimate; the source of truth is your OpenAI invoice.
 *
 * The Batch API bills at 50% of these rates (see BATCH_DISCOUNT).
 * Cached input tokens (prompt_tokens_details.cached_tokens) bill at the cheaper `cachedInput` rate.
 */
export const PRICING_VERSION = '2026-05-25'

const BATCH_DISCOUNT = 0.5

interface ModelRate {
  /** uncached input tokens, $/1M */
  input: number
  /** cached input tokens, $/1M */
  cachedInput: number
  /** output tokens, $/1M */
  output: number
}

const RATES: Record<string, ModelRate> = {
  'gpt-4.1': { input: 2.0, cachedInput: 0.5, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, cachedInput: 0.1, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, cachedInput: 0.025, output: 0.4 },
}

/** True when we have a price for this model; unknown models record tokens but cost 0. */
export function isModelPriced(model: string): boolean {
  return model in RATES
}

/**
 * Computes the estimated USD cost of one call from raw token counts.
 * `promptTokens` is the OpenAI total prompt count and already includes `cachedTokens`,
 * so uncached input = promptTokens − cachedTokens.
 * Unknown models return 0 (tokens are still stored, so the call surfaces as "unpriced").
 */
export function computeCostUsd(args: {
  model: string
  promptTokens: number
  cachedTokens: number
  completionTokens: number
  isBatch: boolean
}): number {
  const rate = RATES[args.model]
  if (!rate) return 0

  const uncachedInput = Math.max(0, args.promptTokens - args.cachedTokens)
  const inputCost = (uncachedInput / 1_000_000) * rate.input + (args.cachedTokens / 1_000_000) * rate.cachedInput
  const outputCost = (args.completionTokens / 1_000_000) * rate.output
  const gross = inputCost + outputCost

  return args.isBatch ? gross * BATCH_DISCOUNT : gross
}
