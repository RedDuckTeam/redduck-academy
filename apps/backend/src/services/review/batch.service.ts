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

  // Verify the model returned exactly one criterion per rubric task — no duplicates, no omissions,
  // no fabricated taskIds. This is the real length lock: OpenAI's strict minItems/maxItems helps,
  // but Anthropic drops those keywords, so this check is what actually guarantees full coverage.
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
