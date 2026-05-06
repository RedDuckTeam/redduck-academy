import { z } from 'zod'

const fileReviewCommentSchema = z.object({
  line: z.number().optional(),
  type: z.enum(['error', 'warning', 'suggestion', 'praise']),
  message: z.string(),
})

const fileReviewSchema = z.object({
  filePath: z.string(),
  comments: z.array(fileReviewCommentSchema),
})

const securityIssueSchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  filePath: z.string().optional(),
  line: z.number().optional(),
})

export const reviewCriterionFeedbackSchema = z.object({
  taskId: z.string(),
  name: z.string(),
  passed: z.boolean(),
  comment: z.string(),
})
export type ReviewCriterionFeedback = z.infer<typeof reviewCriterionFeedbackSchema>

/**
 * Learner-facing review feedback.
 * Excluded vs admin shape: `promptInjectionDetected`, `promptInjectionNotes`.
 * `fileReviews` and `securityIssues` are dropped by the sanitizer when any
 * rubric criterion is hidden, since the AI may name hidden criteria there.
 */
export const learnerReviewFeedbackSchema = z.object({
  lessonPassed: z.boolean(),
  summary: z.string(),
  criteria: z.array(reviewCriterionFeedbackSchema),
  fileReviews: z.array(fileReviewSchema).optional(),
  securityIssues: z.array(securityIssueSchema).optional(),
})

/** Admin-only feedback shape — includes prompt-injection signals for triage. */
export const adminReviewFeedbackSchema = learnerReviewFeedbackSchema.extend({
  promptInjectionDetected: z.boolean(),
  promptInjectionNotes: z.string(),
})

export type LearnerReviewFeedback = z.infer<typeof learnerReviewFeedbackSchema>
export type AdminReviewFeedback = z.infer<typeof adminReviewFeedbackSchema>
