import type { Lesson } from '@redduck/payload-config'
import { getAiProvider } from '../ai'
import type { NormalizedUsage } from '../ai/usage.service'
import type { ReviewFeedback } from '../../types/review-feedback'
import { buildReviewFeedbackSchema } from './review-feedback-json-schema'
import type { ReviewPrompt } from './prompt.builder'
import { Logger } from '../../lib/logger'

const logger = new Logger('ReviewBatchService')

const ASSISTANT_OUTPUT_LOG_MAX_CHARS = 8_000

// Review feedback can be large (one criterion per rubric task, each with quoted evidence), so give
// the model generous output headroom. OpenAI ignores this; Anthropic needs an explicit cap.
const REVIEW_MAX_OUTPUT_TOKENS = 16_384

export type BatchPollResult =
  | { type: 'pending' }
  | { type: 'failed'; message: string }
  | { type: 'completed'; feedback: ReviewFeedback; usage: NormalizedUsage | null; model: string }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Batch custom_id used to match a submission's request back to its result. */
function customIdFor(submissionId: number): string {
  return `submission-${submissionId}`
}

// ─── Batch creation ──────────────────────────────────────────────────────────

/** Creates one structured-review batch job via the configured provider. Returns the batch id. */
export async function createBatch(prompt: ReviewPrompt, submissionId: number, criteriaCount: number): Promise<string> {
  const provider = getAiProvider()
  return provider.createBatch({
    customId: customIdFor(submissionId),
    model: provider.reviewModel,
    system: prompt.system,
    user: prompt.user,
    output: buildReviewFeedbackSchema(criteriaCount),
    maxOutputTokens: REVIEW_MAX_OUTPUT_TOKENS,
  })
}

// ─── Output parsing ──────────────────────────────────────────────────────────

/** Coerce the model's confidence to the allowed enum; anything unexpected becomes `low` (fails safe). */
function coerceConfidence(v: unknown): 'high' | 'medium' | 'low' {
  return v === 'high' || v === 'medium' ? v : 'low'
}

/** Parse a 1-based rubric index from the model; returns null unless it is an integer in [1, n]. */
function normalizeIndex(v: unknown, n: number): number | null {
  const i = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isInteger(i) && i >= 1 && i <= n ? i : null
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

  // Map each grader row to its rubric task without trusting the model to transcribe 24-char
  // ObjectIds (echoed ids were the whole "unknown/duplicate taskId" failure class, and neither
  // provider enforces one-row-per-task: OpenAI ignores minItems/maxItems under strict mode,
  // Anthropic strips them). Two safe strategies, chosen by what the rows actually carry:
  //   1. By echoed taskId — only when every row carries a distinct, valid rubric id covering all
  //      tasks. That is the OLD output shape (in-flight batches spanning a deploy); an opaque id
  //      maps correctly even when the rows are out of order.
  //   2. By array POSITION — the current shape, where each row carries a 1-based `index`. We map by
  //      position, NOT by the `index` label: a swapped-but-valid label permutation is
  //      indistinguishable from out-of-order rows, so honoring the label could cross-assign a
  //      verdict to the wrong criterion. `index` is only an ordering nudge for the model.
  // Gaps become safe fails; extra rows are dropped. This never throws.
  const n = tasks.length
  const rows = Array.isArray(parsed.criteria) ? parsed.criteria.filter(isRecord) : []
  const idToPos = new Map(tasks.map((t, i) => [String(t.id), i]))
  const rowIds = rows.map((c) => (typeof c.taskId === 'string' ? c.taskId : null))
  const mappableByTaskId =
    rows.length === n && rowIds.every((id) => id !== null && idToPos.has(id)) && new Set(rowIds).size === n

  let rowForTask: (i: number) => Record<string, unknown> | undefined
  if (mappableByTaskId) {
    const byId = new Map<string, Record<string, unknown>>()
    rows.forEach((c, k) => byId.set(rowIds[k] as string, c))
    rowForTask = (i) => byId.get(String(tasks[i].id))
  } else {
    if (rows.length === n && rows.some((c, i) => normalizeIndex(c.index, n) !== i + 1)) {
      logger.error('Grader rows not in rubric order; mapped positionally (recovered)', undefined, { submissionId })
    }
    rowForTask = (i) => rows[i]
  }

  const criteria: ReviewFeedback['criteria'] = tasks.map((t, i) => {
    const taskId = String(t.id)
    const title = t.title != null ? String(t.title).trim() : ''
    const c = rowForTask(i)
    if (!c) {
      // No row for this rubric item. Fail it safely with an instructor note rather than dropping
      // coverage — a required item must never silently disappear from the result.
      return {
        taskId,
        name: title,
        evidence: `The grader returned no row for rubric item ${i + 1} ("${title}").`,
        confidence: 'low',
        passed: false,
        comment: 'This requirement could not be evaluated automatically. Please resubmit.',
      }
    }
    return {
      taskId,
      name: typeof c.name === 'string' && c.name.trim() !== '' ? c.name : title,
      evidence: typeof c.evidence === 'string' ? c.evidence : '',
      confidence: coerceConfidence(c.confidence),
      passed: c.passed === true,
      comment: typeof c.comment === 'string' ? c.comment : '',
    }
  })

  return {
    lessonPassed: typeof parsed.lessonPassed === 'boolean' ? parsed.lessonPassed : false,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    promptInjectionDetected: parsed.promptInjectionDetected === true,
    promptInjectionNotes: typeof parsed.promptInjectionNotes === 'string' ? parsed.promptInjectionNotes : '',
    criteria,
  }
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

// ─── Batch polling ───────────────────────────────────────────────────────────

/**
 * Polls the batch via the provider and, if completed, parses and validates the review feedback.
 * Returns a discriminated union so the caller can handle each case without try/catch.
 */
export async function pollAndParse(
  batchRequestId: string,
  submissionId: number,
  tasks: NonNullable<Lesson['reviewGradingTasks']>,
): Promise<BatchPollResult> {
  const result = await getAiProvider().pollBatch(batchRequestId, customIdFor(submissionId))
  if (result.type !== 'completed') return result

  try {
    const parsed = parseReviewFeedback(result.content, submissionId, tasks)
    const feedback = applyAdminTitles(applyConfidenceRules(parsed, tasks), tasks)
    return { type: 'completed', feedback, usage: result.usage, model: result.model }
  } catch (err) {
    logger.error('Failed to parse batch output', err, { batchRequestId, submissionId })
    return { type: 'failed', message: 'batch output parse failed' }
  }
}
