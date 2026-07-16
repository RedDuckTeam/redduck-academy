/**
 * Token pricing for every review model, in USD per 1,000,000 tokens. Covers both providers
 * (OpenAI and Anthropic/Claude) — the model id alone identifies the vendor.
 *
 * ⚠️ These rates are hardcoded snapshots — verify against current pricing
 * (https://openai.com/api/pricing, https://platform.claude.com/docs/en/pricing) and bump
 * PRICING_VERSION whenever you change them. Stored `costUsd` is only an estimate; the source of
 * truth is your provider invoice.
 *
 * Both providers' batch APIs bill at 50% of these rates (see BATCH_DISCOUNT).
 * Cached input tokens bill at the cheaper `cachedInput` rate — OpenAI's
 * `prompt_tokens_details.cached_tokens`, Anthropic's `cache_read_input_tokens`.
 */
export const PRICING_VERSION = '2026-07-16'

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
  // OpenAI — current models in use (gpt-5.x)
  'gpt-5.6-luna': { input: 1.0, cachedInput: 0.1, output: 6.0 },
  'gpt-5.4-mini': { input: 0.75, cachedInput: 0.075, output: 4.5 },
  // OpenAI — legacy gpt-4.1 family, kept so historical usage rows still price
  'gpt-4.1': { input: 2.0, cachedInput: 0.5, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, cachedInput: 0.1, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, cachedInput: 0.025, output: 0.4 },
  // Anthropic / Claude (cachedInput = cache-read/hit rate, 0.1x base input).
  // Sonnet 5 carries an intro price of $2/$10 through 2026-08-31; the standard $3/$15 is used here.
  'claude-opus-4-8': { input: 5.0, cachedInput: 0.5, output: 25.0 },
  'claude-sonnet-5': { input: 3.0, cachedInput: 0.3, output: 15.0 },
  'claude-sonnet-4-6': { input: 3.0, cachedInput: 0.3, output: 15.0 },
  'claude-haiku-4-5': { input: 1.0, cachedInput: 0.1, output: 5.0 },
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
