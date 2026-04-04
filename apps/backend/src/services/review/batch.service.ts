import { createReadStream, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import OpenAI from 'openai'
import type { Lesson } from '@redduck/payload-config'
import { env } from '../../env'
import { DEFAULT_MODEL } from '../ai/openai-client'
import type { ReviewFeedback } from '../../types/review-feedback'
import { buildReviewFeedbackResponseFormat } from './review-feedback-json-schema'

const ASSISTANT_OUTPUT_LOG_MAX_CHARS = 8_000

export type BatchPollResult =
  | { type: 'pending' }
  | { type: 'failed'; message: string }
  | { type: 'completed'; feedback: ReviewFeedback }

function getOpenAiClient(): OpenAI {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY })
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ─── Batch creation ──────────────────────────────────────────────────────────

/**
 * Uploads a one-line JSONL file and creates an OpenAI Batch for chat completions.
 * Returns the batch id.
 * @see https://platform.openai.com/docs/guides/batch
 */
export async function createBatch(
  prompt: string,
  submissionId: number,
  criteriaCount: number,
): Promise<string> {
  const openai = getOpenAiClient()
  const line =
    JSON.stringify({
      custom_id: `submission-${submissionId}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: DEFAULT_MODEL,
        response_format: buildReviewFeedbackResponseFormat(criteriaCount),
        messages: [
          {
            role: 'system',
            content:
              'You are a course grader. Fill the response fields to match the lesson context in the user message. Output must follow the configured JSON schema exactly.',
          },
          { role: 'user', content: prompt },
        ],
      },
    }) + '\n'

  const path = join(tmpdir(), `review-batch-${submissionId}-${Date.now()}.jsonl`)
  writeFileSync(path, line, 'utf8')
  try {
    const uploaded = await openai.files.create({ file: createReadStream(path), purpose: 'batch' })
    const batch = await openai.batches.create({
      input_file_id: uploaded.id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
    })
    return batch.id
  } finally {
    try { unlinkSync(path) } catch { /* temp file cleanup — best effort */ }
  }
}

// ─── Batch polling & output parsing ─────────────────────────────────────────

function extractBatchErrorMessage(batch: Awaited<ReturnType<OpenAI['batches']['retrieve']>>): string {
  if (batch.errors?.data && batch.errors.data.length > 0) {
    return batch.errors.data.map((e) => e.message ?? JSON.stringify(e)).join('; ')
  }
  return `OpenAI batch ${batch.status}`
}

function extractChatCompletionContent(jsonlText: string, submissionId: number): string {
  const want = `submission-${submissionId}`
  for (const line of jsonlText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let parsed: unknown
    try { parsed = JSON.parse(trimmed) } catch { continue }
    if (!isRecord(parsed) || parsed.custom_id !== want) continue

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
    return message.content
  }
  throw new Error('No batch output line for this submission')
}

function parseReviewFeedback(content: string, submissionId: number): ReviewFeedback {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    const preview =
      content.length > ASSISTANT_OUTPUT_LOG_MAX_CHARS
        ? `${content.slice(0, ASSISTANT_OUTPUT_LOG_MAX_CHARS)}… (${content.length} chars total)`
        : content
    console.error(`[review sync] submission ${submissionId} assistant message is not valid JSON. Raw output:\n`, preview)
    throw new Error('Assistant output is not valid JSON')
  }
  if (!isRecord(parsed)) throw new Error('Invalid feedback shape')
  if (typeof parsed.lessonPassed !== 'boolean') throw new Error('Invalid feedback: lessonPassed')
  if (typeof parsed.summary !== 'string') throw new Error('Invalid feedback: summary')
  if (!Array.isArray(parsed.criteria)) throw new Error('Invalid feedback: criteria')
  for (const c of parsed.criteria) {
    if (!isRecord(c) || typeof c.points !== 'number') throw new Error('Invalid feedback: criterion points')
  }
  return parsed as unknown as ReviewFeedback
}

/** Overwrites criterion names with CMS grading-task titles so the UI always matches the admin panel. */
function applyAdminTitles(
  feedback: ReviewFeedback,
  tasks: NonNullable<Lesson['reviewGradingTasks']>,
): ReviewFeedback {
  if (tasks.length === 0) return feedback
  const titleByTaskId = new Map(tasks.map((t) => [String(t.id), t.title != null ? String(t.title).trim() : '']))
  return {
    ...feedback,
    criteria: feedback.criteria.map((c) => {
      const title = titleByTaskId.get(c.taskId)
      if (title === undefined) return c
      return { ...c, name: title !== '' ? title : c.name }
    }),
  }
}

/**
 * Polls the batch status and, if completed, downloads and parses the output.
 * Returns a discriminated union so the caller can handle each case without try/catch.
 */
export async function pollAndParse(
  batchRequestId: string,
  submissionId: number,
  tasks: NonNullable<Lesson['reviewGradingTasks']>,
): Promise<BatchPollResult> {
  const openai = getOpenAiClient()
  const batch = await openai.batches.retrieve(batchRequestId)

  if (batch.status === 'failed' || batch.status === 'cancelled' || batch.status === 'expired') {
    return { type: 'failed', message: extractBatchErrorMessage(batch) }
  }
  if (batch.status !== 'completed') {
    return { type: 'pending' }
  }
  if (!batch.output_file_id) {
    return { type: 'failed', message: 'OpenAI batch completed but has no output file' }
  }

  let jsonlText: string
  try {
    const fileResponse = await openai.files.content(batch.output_file_id)
    jsonlText = await fileResponse.text()
  } catch (err) {
    return { type: 'failed', message: err instanceof Error ? err.message : 'Failed to download batch output' }
  }

  try {
    const content = extractChatCompletionContent(jsonlText, submissionId)
    const feedback = applyAdminTitles(parseReviewFeedback(content, submissionId), tasks)
    return { type: 'completed', feedback }
  } catch (err) {
    return { type: 'failed', message: err instanceof Error ? err.message : 'Failed to parse review output' }
  }
}
