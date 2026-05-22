/**
 * Stored in `project_user_submissions.feedback` (jsonb) when review completes.
 * Extends the AI-CODE-REVIEW.md shape: each criterion includes `taskId` for Payload `reviewGradingTasks` row identity.
 */

export interface ReviewCriterionFeedback {
  /** Payload `reviewGradingTasks` row id (public lesson API) */
  taskId: string
  name: string
  passed: boolean
  comment: string
}

export interface ReviewFeedback {
  /** Whether the learner passes the lesson; set by the grader model (authoritative for completion) */
  lessonPassed: boolean
  summary: string
  /** True when the grader flagged manipulation attempts in the submitted code. */
  promptInjectionDetected: boolean
  /** Free-text description of detected manipulation attempts; empty string when none. */
  promptInjectionNotes: string
  criteria: ReviewCriterionFeedback[]
  fileReviews?: Array<{
    filePath: string
    comments: Array<{
      line?: number
      type: 'error' | 'warning' | 'suggestion' | 'praise'
      message: string
    }>
  }>
  securityIssues?: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    description: string
    filePath?: string
    line?: number
  }>
}
