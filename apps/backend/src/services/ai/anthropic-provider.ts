import Anthropic from '@anthropic-ai/sdk'
import { env } from '../../env'
import { Logger } from '../../lib/logger'
import { normalizeAnthropicUsage } from './usage.service'
import type {
  AiProvider,
  BatchCreateRequest,
  BatchPollResult,
  JsonSchema,
  StructuredChatRequest,
  StructuredChatResult,
} from './provider'

const logger = new Logger('AnthropicProvider')

// Model roles, mirroring the OpenAI strong/cheap split: project review uses Sonnet 4.6; the
// coding-task check uses Haiku 4.5, the cheapest Claude model.
export const ANTHROPIC_REVIEW_MODEL = 'claude-sonnet-4-6'
export const ANTHROPIC_CODING_TASK_MODEL = 'claude-haiku-4-5'

/** Output-token cap. JSON grading output is small; no thinking, so this is generous headroom. */
const DEFAULT_MAX_OUTPUT_TOKENS = 8192

// JSON Schema keywords Claude's structured outputs do not support. We drop them before sending;
// the review layer re-validates shape and criteria count itself, so nothing is lost.
const UNSUPPORTED_SCHEMA_KEYS = new Set([
  'minItems',
  'maxItems',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'pattern',
])

/** Deep-copies a JSON Schema, stripping constraint keywords Claude rejects. */
function sanitizeSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeSchema)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (UNSUPPORTED_SCHEMA_KEYS.has(k)) continue
      out[k] = sanitizeSchema(v)
    }
    return out
  }
  return value
}

/** Anthropic structured output: constrain the response to a JSON Schema via `output_config`. */
function outputConfig(schema: JsonSchema) {
  return { format: { type: 'json_schema' as const, schema: sanitizeSchema(schema) as JsonSchema } }
}

/** Pulls the JSON text out of a completed message (skips thinking/other blocks). */
function textFrom(content: Anthropic.Messages.ContentBlock[]): string {
  const block = content.find((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
  return block?.text ?? ''
}

export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic' as const
  readonly reviewModel = ANTHROPIC_REVIEW_MODEL
  readonly codingTaskModel = ANTHROPIC_CODING_TASK_MODEL

  private readonly client: Anthropic

  constructor() {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  }

  async chatStructured(req: StructuredChatRequest): Promise<StructuredChatResult> {
    const message = await this.client.messages.create({
      model: req.model,
      max_tokens: req.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
      output_config: outputConfig(req.output.schema),
    })
    return { content: textFrom(message.content), usage: normalizeAnthropicUsage(message.usage), model: message.model }
  }

  /**
   * Creates a single-request Message Batch. Anthropic bills batches at 50% of standard rates.
   * @see https://platform.claude.com/docs/en/build-with-claude/batch-processing
   */
  async createBatch(req: BatchCreateRequest): Promise<string> {
    const batch = await this.client.messages.batches.create({
      requests: [
        {
          custom_id: req.customId,
          params: {
            model: req.model,
            max_tokens: req.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            system: req.system,
            messages: [{ role: 'user', content: req.user }],
            output_config: outputConfig(req.output.schema),
          },
        },
      ],
    })
    return batch.id
  }

  async pollBatch(batchId: string, customId: string): Promise<BatchPollResult> {
    let batch: Awaited<ReturnType<Anthropic['messages']['batches']['retrieve']>>
    try {
      batch = await this.client.messages.batches.retrieve(batchId)
    } catch (err) {
      logger.error('Failed to retrieve batch status', err, { batchId, customId })
      return { type: 'failed', message: 'batch retrieval failed' }
    }

    // Anthropic batches have no whole-batch failure state: while running it is `in_progress`,
    // and every request lands as an individual result once the batch is `ended`.
    if (batch.processing_status !== 'ended') return { type: 'pending' }

    try {
      for await (const result of await this.client.messages.batches.results(batchId)) {
        if (result.custom_id !== customId) continue
        if (result.result.type === 'succeeded') {
          const msg = result.result.message
          return { type: 'completed', content: textFrom(msg.content), usage: normalizeAnthropicUsage(msg.usage), model: msg.model }
        }
        logger.error('Batch item ended in non-success state', undefined, { batchId, customId, resultType: result.result.type })
        return { type: 'failed', message: `batch item ${result.result.type}` }
      }
    } catch (err) {
      logger.error('Failed to read batch results', err, { batchId, customId })
      return { type: 'failed', message: 'batch results read failed' }
    }

    return { type: 'failed', message: 'no batch result for this custom_id' }
  }
}
