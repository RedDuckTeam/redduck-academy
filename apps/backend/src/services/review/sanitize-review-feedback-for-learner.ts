import type { LearnerReviewFeedback } from '@redduck/api-contracts'
import type { ReviewFeedback } from '../../types/review-feedback'

/** Shown in API responses for hidden rubric rows so model hints are not leaked via comments. Sync with web `HIDDEN_CRITERION_FEEDBACK_PLACEHOLDER`. */
export const HIDDEN_CRITERION_FEEDBACK_PLACEHOLDER =
  'Feedback for this criterion is omitted until you discover the approach.'

/**
 * Convert raw AI feedback into the learner-facing shape.
 * - Drops `promptInjectionDetected` / `promptInjectionNotes` (instructor-triage only).
 * - Drops per-criterion `evidence` / `confidence` (instructor-only; evidence quotes code and may reveal solution hints).
 * - Replaces hidden criteria comments with a placeholder.
 * - When *any* criterion is hidden, drops `fileReviews` and `securityIssues` entirely
 *   since the AI is not asked to tag those entries by criterion and may include hints.
 */
export function sanitizeReviewFeedbackForLearner(
  feedback: ReviewFeedback | null,
  hiddenTaskIds: Set<string>,
): LearnerReviewFeedback | null {
  if (!feedback) return null
  const hasHidden = hiddenTaskIds.size > 0
  return {
    lessonPassed: feedback.lessonPassed,
    summary: feedback.summary,
    criteria: feedback.criteria.map((c) => ({
      taskId: c.taskId,
      name: c.name,
      passed: c.passed,
      comment: hiddenTaskIds.has(c.taskId) ? HIDDEN_CRITERION_FEEDBACK_PLACEHOLDER : c.comment,
    })),
    ...(hasHidden ? {} : { fileReviews: feedback.fileReviews, securityIssues: feedback.securityIssues }),
  }
}
