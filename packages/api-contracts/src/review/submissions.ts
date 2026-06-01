import { z } from 'zod'
import { adminReviewFeedbackSchema, learnerReviewFeedbackSchema } from './feedback'

export const projectSubmissionStatusSchema = z.enum(['pending', 'completed', 'failed'])

/**
 * Project review submission shown to the learner. Includes `repoUrl` — it's the
 * learner's own submitted repository, surfaced so the submit form can pre-fill it
 * on retries.
 * Excluded vs admin shape: `commitSha`, `batchRequestId` (review internals, no UI consumer).
 */
export const learnerProjectSubmissionSchema = z.object({
  id: z.number().int(),
  status: projectSubmissionStatusSchema,
  submittedAt: z.string(),
  repoUrl: z.string(),
  feedback: learnerReviewFeedbackSchema.nullable(),
  errorMessage: z.string().nullable(),
})

export const adminProjectSubmissionSchema = learnerProjectSubmissionSchema.extend({
  /** Resolved commit SHA that was reviewed; null until the batch is created (admin-only). */
  commitSha: z.string().nullable(),
  batchRequestId: z.string().nullable(),
  feedback: adminReviewFeedbackSchema.nullable(),
})

/**
 * Coding-task submission shown to the learner.
 * Excluded vs admin shape: `aiComment` (packed VerdictMetadata JSON, admin-only note).
 */
export const learnerCodingTaskSubmissionSchema = z.object({
  id: z.number().int(),
  passed: z.boolean(),
  submittedAt: z.string(),
  submittedCode: z.string(),
})

export const adminCodingTaskSubmissionSchema = learnerCodingTaskSubmissionSchema.extend({
  aiComment: z.string().nullable(),
})

export type LearnerProjectSubmission = z.infer<typeof learnerProjectSubmissionSchema>
export type AdminProjectSubmission = z.infer<typeof adminProjectSubmissionSchema>
export type LearnerCodingTaskSubmission = z.infer<typeof learnerCodingTaskSubmissionSchema>
export type AdminCodingTaskSubmission = z.infer<typeof adminCodingTaskSubmissionSchema>
export type ProjectSubmissionStatus = z.infer<typeof projectSubmissionStatusSchema>
