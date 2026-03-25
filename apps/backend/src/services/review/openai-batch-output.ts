import type { Lesson } from '@redduck/payload-config'
import type { ReviewFeedback } from '../../types/review-feedback'

const ASSISTANT_OUTPUT_LOG_MAX_CHARS = 8_000

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Reads OpenAI Batch API output JSONL and returns the assistant message for `custom_id` submission-{id}.
 * @see https://platform.openai.com/docs/guides/batch
 */
export function extractChatCompletionContentFromBatchJsonl(jsonlText: string, submissionId: number): string {
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
    if (!isRecord(response)) {
      throw new Error('Invalid batch output: missing response')
    }

    const statusCode = response.status_code
    if (statusCode !== 200) {
      const body = response.body
      const errMsg =
        isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string'
          ? body.error.message
          : `Batch item status ${String(statusCode)}`
      throw new Error(`Batch line item failed: ${errMsg}`)
    }

    const body = response.body
    if (!isRecord(body)) {
      throw new Error('Missing response body in batch output')
    }
    const choices = body.choices
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error('No choices in batch completion')
    }
    const choice0 = choices[0]
    if (!isRecord(choice0)) {
      throw new Error('Invalid choice shape')
    }
    const message = choice0.message
    if (!isRecord(message) || typeof message.content !== 'string') {
      throw new Error('Missing assistant message content')
    }
    return message.content
  }
  throw new Error('No batch output line for this submission')
}

/** Overwrite criterion names with CMS grading-task titles so UI always matches admin panel (taskId must match). */
export function applyAdminTitlesToReviewFeedback(
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

export function parseReviewFeedbackFromAssistantContent(
  content: string,
  logContext?: { submissionId: number },
): ReviewFeedback {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    const preview =
      content.length > ASSISTANT_OUTPUT_LOG_MAX_CHARS
        ? `${content.slice(0, ASSISTANT_OUTPUT_LOG_MAX_CHARS)}… (${content.length} chars total)`
        : content
    const prefix = logContext ? `[review sync] submission ${logContext.submissionId}` : '[review sync]'
    console.error(`${prefix} assistant message is not valid JSON. Raw output:\n`, preview)
    throw new Error('Assistant output is not valid JSON')
  }
  if (!isRecord(parsed)) {
    throw new Error('Invalid feedback shape')
  }
  if (typeof parsed.lessonPassed !== 'boolean') {
    throw new Error('Invalid feedback: lessonPassed')
  }
  if (typeof parsed.summary !== 'string') {
    throw new Error('Invalid feedback: summary')
  }
  if (!Array.isArray(parsed.criteria)) {
    throw new Error('Invalid feedback: criteria')
  }
  for (const c of parsed.criteria) {
    if (!isRecord(c) || typeof c.points !== 'number') {
      throw new Error('Invalid feedback: criterion points')
    }
  }
  return parsed as unknown as ReviewFeedback
}

export function sumCriteriaPoints(feedback: ReviewFeedback): number {
  return feedback.criteria.reduce((sum, c) => sum + c.points, 0)
}
