import { createReadStream, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import OpenAI from 'openai'
import type { Lesson } from '@redduck/payload-config'
import { env } from '../../env'
import { DEFAULT_MODEL } from '../ai/openai-client'
import { normalizeUsage, type NormalizedUsage } from '../ai/usage.service'
import type { ReviewFeedback } from '../../types/review-feedback'
import { buildReviewFeedbackResponseFormat } from './review-feedback-json-schema'
import type { ReviewPrompt } from './prompt.builder'
import { Logger } from '../../lib/logger'

const logger = new Logger('ReviewBatchService')

const ASSISTANT_OUTPUT_LOG_MAX_CHARS = 8_000

export type BatchPollResult =
  | { type: 'pending' }
  | { type: 'failed'; message: string }
  | { type: 'completed'; feedback: ReviewFeedback; usage: NormalizedUsage | null; model: string }

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
export async function createBatch(prompt: ReviewPrompt, submissionId: number, criteriaCount: number): Promise<string> {
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
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
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
    try {
      unlinkSync(path)
    } catch {
      /* temp file cleanup — best effort */
    }
  }
}

// ─── Batch polling & output parsing ─────────────────────────────────────────

function extractBatchErrorMessage(batch: Awaited<ReturnType<OpenAI['batches']['retrieve']>>): string {
  if (batch.errors?.data && batch.errors.data.length > 0) {
    return batch.errors.data.map((e) => e.message ?? JSON.stringify(e)).join('; ')
  }
  return `OpenAI batch ${batch.status}`
}

function extractBatchCompletion(
  jsonlText: string,
  submissionId: number,
): { content: string; usage: unknown; model: string | null } {
  const want = `submission-${submissionId}`
  for (const line of jsonlText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      continue
    }
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
    return {
      content: message.content,
      usage: body.usage ?? null,
      model: typeof body.model === 'string' ? body.model : null,
    }
  }
  throw new Error('No batch output line for this submission')
}

function parseReviewFeedback(
  content: string,
  submissionId: number,
  tasks: NonNullable<Lesson['reviewGradingTasks']>,
): ReviewFeedback {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (err) {
    const preview =
      content.length > ASSISTANT_OUTPUT_LOG_MAX_CHARS
        ? `${content.slice(0, ASSISTANT_OUTPUT_LOG_MAX_CHARS)}… (${content.length} chars total)`
        : content
    logger.error('Assistant message is not valid JSON', err, { submissionId, preview })
    throw new Error('Assistant output is not valid JSON')
  }
  if (!isRecord(parsed)) throw new Error('Invalid feedback shape')
  if (typeof parsed.lessonPassed !== 'boolean') throw new Error('Invalid feedback: lessonPassed')
  if (typeof parsed.summary !== 'string') throw new Error('Invalid feedback: summary')
  if (typeof parsed.promptInjectionDetected !== 'boolean') {
    throw new Error('Invalid feedback: promptInjectionDetected')
  }
  if (typeof parsed.promptInjectionNotes !== 'string') {
    throw new Error('Invalid feedback: promptInjectionNotes')
  }
  if (!Array.isArray(parsed.criteria)) throw new Error('Invalid feedback: criteria')
  for (const c of parsed.criteria) {
    if (!isRecord(c) || typeof c.passed !== 'boolean') throw new Error('Invalid feedback: criterion passed')
    if (typeof c.taskId !== 'string') throw new Error('Invalid feedback: criterion taskId')
    if (typeof c.evidence !== 'string') throw new Error('Invalid feedback: criterion evidence')
    if (c.confidence !== 'high' && c.confidence !== 'medium' && c.confidence !== 'low') {
      throw new Error('Invalid feedback: criterion confidence')
    }
  }

  // Verify the model returned exactly one criterion per rubric task — no
  // duplicates, no omissions, no fabricated taskIds. Without this, the
  // strict-schema length lock (minItems = maxItems = N) would still allow
  // a duplicated taskId to displace a missing one.
  const expectedIds = new Set(tasks.map((t) => String(t.id)))
  const seenIds = new Set<string>()
  for (const c of parsed.criteria as Array<{ taskId: string }>) {
    if (!expectedIds.has(c.taskId)) {
      throw new Error(`Invalid feedback: unknown taskId ${c.taskId}`)
    }
    if (seenIds.has(c.taskId)) {
      throw new Error(`Invalid feedback: duplicate taskId ${c.taskId}`)
    }
    seenIds.add(c.taskId)
  }
  if (seenIds.size !== expectedIds.size) {
    throw new Error('Invalid feedback: criteria do not cover every rubric task')
  }

  return parsed as unknown as ReviewFeedback
}

/**
 * Enforces the confidence floor and recomputes pass/fail deterministically.
 * - A `low`-confidence row means the grader saw no clear evidence, so its `passed` is forced false.
 * - `lessonPassed` is then forced false if any required rubric task ends up failed (downward only —
 *   we never flip the model's verdict to pass).
 */
function applyConfidenceRules(feedback: ReviewFeedback, tasks: NonNullable<Lesson['reviewGradingTasks']>): ReviewFeedback {
  const criteria = feedback.criteria.map((c) => (c.confidence === 'low' && c.passed ? { ...c, passed: false } : c))
  const requiredIds = new Set(tasks.filter((t) => t.isRequired).map((t) => String(t.id)))
  const anyRequiredFailed =
    requiredIds.size > 0 && criteria.some((c) => requiredIds.has(c.taskId) && !c.passed)
  return {
    ...feedback,
    criteria,
    lessonPassed: anyRequiredFailed ? false : feedback.lessonPassed,
  }
}

/** Overwrites criterion names with CMS grading-task titles so the UI always matches the admin panel. */
function applyAdminTitles(feedback: ReviewFeedback, tasks: NonNullable<Lesson['reviewGradingTasks']>): ReviewFeedback {
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

  let batch: Awaited<ReturnType<OpenAI['batches']['retrieve']>>
  try {
    batch = await openai.batches.retrieve(batchRequestId)
  } catch (err) {
    logger.error('Failed to retrieve batch status', err, { batchRequestId, submissionId })
    return { type: 'failed', message: 'batch retrieval failed' }
  }

  if (batch.status === 'failed' || batch.status === 'cancelled' || batch.status === 'expired') {
    logger.error('Batch ended in terminal non-success state', undefined, {
      batchRequestId,
      submissionId,
      status: batch.status,
      detail: extractBatchErrorMessage(batch),
    })
    return { type: 'failed', message: `batch ${batch.status}` }
  }
  if (batch.status !== 'completed') {
    return { type: 'pending' }
  }
  if (!batch.output_file_id) {
    logger.error('Batch completed with no output_file_id', undefined, { batchRequestId, submissionId })
    return { type: 'failed', message: 'batch has no output file' }
  }

  let jsonlText: string
  try {
    const fileResponse = await openai.files.content(batch.output_file_id)
    jsonlText = await fileResponse.text()
  } catch (err) {
    logger.error('Failed to download batch output', err, {
      batchRequestId,
      submissionId,
      outputFileId: batch.output_file_id,
    })
    return { type: 'failed', message: 'batch output download failed' }
  }

  try {
    const { content, usage, model } = extractBatchCompletion(jsonlText, submissionId)
    const parsed = parseReviewFeedback(content, submissionId, tasks)
    const feedback = applyAdminTitles(applyConfidenceRules(parsed, tasks), tasks)
    return { type: 'completed', feedback, usage: normalizeUsage(usage), model: model ?? DEFAULT_MODEL }
  } catch (err) {
    logger.error('Failed to parse batch output', err, { batchRequestId, submissionId })
    return { type: 'failed', message: 'batch output parse failed' }
  }
}
