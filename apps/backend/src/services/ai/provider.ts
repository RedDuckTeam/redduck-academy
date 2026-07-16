import type { NormalizedUsage } from './usage.service'

/**
 * Provider-agnostic AI abstraction for the review subsystem.
 *
 * Both review flows (synchronous coding-task checks and asynchronous project-review batches)
 * call an {@link AiProvider} instead of a vendor SDK directly. `getAiProvider()` in `./index.ts`
 * picks the concrete provider from the `AI_PROVIDER` env flag (OpenAI by default, Anthropic when
 * switched). Everything above this layer — prompt building, feedback parsing, usage/cost recording —
 * is written once and works for either vendor.
 */

export type AiProviderName = 'openai' | 'anthropic'

/** A raw JSON Schema object describing the structured output the model must return. */
export type JsonSchema = Record<string, unknown>

/** The structured-output contract for one request: a named JSON Schema. */
export interface StructuredSchema {
  /** Machine name for the schema, e.g. `review_feedback`. */
  name: string
  /** Human description handed to the model. */
  description: string
  /** The raw JSON Schema for the object the model must produce. */
  schema: JsonSchema
}

export interface StructuredChatRequest {
  model: string
  system: string
  user: string
  output: StructuredSchema
  /** Cap on the model's output tokens. Providers apply a sensible default when omitted. */
  maxOutputTokens?: number
}

export interface StructuredChatResult {
  /** Raw JSON text the model produced (still unparsed). */
  content: string
  usage: NormalizedUsage | null
  /** The model id the provider actually ran (as reported by the API). */
  model: string
}

export interface BatchCreateRequest {
  /** Stable id used to match a batch result back to its submission. */
  customId: string
  model: string
  system: string
  user: string
  output: StructuredSchema
  maxOutputTokens?: number
}

export type BatchPollResult =
  | { type: 'pending' }
  | { type: 'failed'; message: string }
  | { type: 'completed'; content: string; usage: NormalizedUsage | null; model: string }

export interface AiProvider {
  readonly name: AiProviderName
  /** Strong model used for full project review. */
  readonly reviewModel: string
  /** Cheaper model used for coding-task checks. */
  readonly codingTaskModel: string

  /** One synchronous structured-output call. */
  chatStructured(req: StructuredChatRequest): Promise<StructuredChatResult>

  /** Create an async batch job for one structured request; returns the provider's batch id. */
  createBatch(req: BatchCreateRequest): Promise<string>

  /** Poll a batch and, when it has finished, return the matched item's raw JSON + usage. */
  pollBatch(batchId: string, customId: string): Promise<BatchPollResult>
}
