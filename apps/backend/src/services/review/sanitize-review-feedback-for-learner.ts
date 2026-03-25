import type { ReviewFeedback } from '../../types/review-feedback'

/** Shown in API responses for hidden rubric rows so model hints are not leaked via comments. Sync with web `HIDDEN_CRITERION_FEEDBACK_PLACEHOLDER`. */
export const HIDDEN_CRITERION_FEEDBACK_PLACEHOLDER =
  'Feedback for this criterion is omitted until you discover the approach.'

export function sanitizeReviewFeedbackForLearner(
  feedback: ReviewFeedback | null,
  hiddenTaskIds: Set<string>,
): ReviewFeedback | null {
  if (!feedback) return null
  return {
    ...feedback,
    criteria: feedback.criteria.map((c) =>
      hiddenTaskIds.has(c.taskId) ? { ...c, comment: HIDDEN_CRITERION_FEEDBACK_PLACEHOLDER } : c,
    ),
  }
}
