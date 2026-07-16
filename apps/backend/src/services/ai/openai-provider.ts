import { createReadStream, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import OpenAI from 'openai'
import { env } from '../../env'
import { Logger } from '../../lib/logger'
import { normalizeUsage } from './usage.service'
import type {
  AiProvider,
  BatchCreateRequest,
  BatchPollResult,
  StructuredChatRequest,
  StructuredChatResult,
  StructuredSchema,
} from './provider'

const logger = new Logger('OpenAiProvider')

/** Strong model for full project review. */
export const OPENAI_REVIEW_MODEL = 'gpt-5.6-luna'
/** Cheaper model for coding-task checks. */
export const OPENAI_CODING_TASK_MODEL = 'gpt-5.4-mini'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Wraps a raw {@link StructuredSchema} in OpenAI's `response_format` shape. */
function toResponseFormat(output: StructuredSchema) {
  return {
    type: 'json_schema' as const,
    json_schema: {
      name: output.name,
      description: output.description,
      strict: true,
      schema: output.schema,
    },
  }
}

/**
 * Pulls the completion for `customId` out of a Batch API JSONL output file. Returns the raw
 * assistant JSON plus usage/model; feedback-shape validation happens above the provider layer.
 */
function extractBatchCompletion(
  jsonlText: string,
  customId: string,
): { content: string; usage: unknown; model: string | null } {
  for (const line of jsonlText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      continue
    }
    if (!isRecord(parsed) || parsed.custom_id !== customId) continue

    const response = parsed.response
    if (!isRecord(response)) throw new Error('Invalid batch output: missing response')

    if (response.status_code !== 200) {
      const body = response.body
      const msg =
        isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string'
          ? body.error.message
          : `Batch item status ${String(response.status_code)}`
      throw new Error(`Batch line item failed: ${msg}`)
    }

    const body = response.body
    if (!isRecord(body)) throw new Error('Missing response body in batch output')
    const choices = body.choices
    if (!Array.isArray(choices) || choices.length === 0) throw new Error('No choices in batch completion')
    const choice0 = choices[0]
    if (!isRecord(choice0)) throw new Error('Invalid choice shape')
    const message = choice0.message
    if (!isRecord(message) || typeof message.content !== 'string') throw new Error('Missing assistant message content')
    return {
      content: message.content,
      usage: body.usage ?? null,
      model: typeof body.model === 'string' ? body.model : null,
    }
  }
  throw new Error('No batch output line for this custom_id')
}

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai' as const
  readonly reviewModel = OPENAI_REVIEW_MODEL
  readonly codingTaskModel = OPENAI_CODING_TASK_MODEL

  private readonly client: OpenAI

  constructor() {
    if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }

  async chatStructured(req: StructuredChatRequest): Promise<StructuredChatResult> {
    const completion = await this.client.chat.completions.create({
      model: req.model,
      response_format: toResponseFormat(req.output),
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    })
    const content = completion.choices[0]?.message?.content ?? ''
    return { content, usage: normalizeUsage(completion.usage), model: completion.model }
  }

  /**
   * Uploads a one-line JSONL file and creates an OpenAI Batch for one chat completion.
   * @see https://platform.openai.com/docs/guides/batch
   */
  async createBatch(req: BatchCreateRequest): Promise<string> {
    const line =
      JSON.stringify({
        custom_id: req.customId,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: req.model,
          response_format: toResponseFormat(req.output),
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.user },
          ],
        },
      }) + '\n'

    const path = join(tmpdir(), `ai-batch-${req.customId}-${Date.now()}.jsonl`)
    writeFileSync(path, line, 'utf8')
    try {
      const uploaded = await this.client.files.create({ file: createReadStream(path), purpose: 'batch' })
      const batch = await this.client.batches.create({
        input_file_id: uploaded.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
      })
      return batch.id
    } finally {
      try {
        unlinkSync(path)
      } catch {
        /* temp file cleanup — best effort */
      }
    }
  }

  async pollBatch(batchId: string, customId: string): Promise<BatchPollResult> {
    let batch: Awaited<ReturnType<OpenAI['batches']['retrieve']>>
    try {
      batch = await this.client.batches.retrieve(batchId)
    } catch (err) {
      logger.error('Failed to retrieve batch status', err, { batchId, customId })
      return { type: 'failed', message: 'batch retrieval failed' }
    }

    if (batch.status === 'failed' || batch.status === 'cancelled' || batch.status === 'expired') {
      const detail =
        batch.errors?.data && batch.errors.data.length > 0
          ? batch.errors.data.map((e) => e.message ?? JSON.stringify(e)).join('; ')
          : `OpenAI batch ${batch.status}`
      logger.error('Batch ended in terminal non-success state', undefined, { batchId, customId, status: batch.status, detail })
      return { type: 'failed', message: `batch ${batch.status}` }
    }
    if (batch.status !== 'completed') return { type: 'pending' }
    if (!batch.output_file_id) {
      logger.error('Batch completed with no output_file_id', undefined, { batchId, customId })
      return { type: 'failed', message: 'batch has no output file' }
    }

    let jsonlText: string
    try {
      const fileResponse = await this.client.files.content(batch.output_file_id)
      jsonlText = await fileResponse.text()
    } catch (err) {
      logger.error('Failed to download batch output', err, { batchId, customId, outputFileId: batch.output_file_id })
      return { type: 'failed', message: 'batch output download failed' }
    }

    try {
      const { content, usage, model } = extractBatchCompletion(jsonlText, customId)
      return { type: 'completed', content, usage: normalizeUsage(usage), model: model ?? this.reviewModel }
    } catch (err) {
      logger.error('Failed to parse batch output', err, { batchId, customId })
      return { type: 'failed', message: 'batch output parse failed' }
    }
  }
}
