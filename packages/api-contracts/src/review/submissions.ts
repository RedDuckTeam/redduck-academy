import { z } from 'zod'
import { adminReviewFeedbackSchema, learnerReviewFeedbackSchema } from './feedback'

export const projectSubmissionStatusSchema = z.enum(['pending', 'completed', 'failed'])

/**
 * Project review submission shown to the learner.
 * Excluded vs admin shape: `batchRequestId` (internal OpenAI batch id, no UI consumer).
 */
export const learnerProjectSubmissionSchema = z.object({
  id: z.number().int(),
  status: projectSubmissionStatusSchema,
  submittedAt: z.string(),
  feedback: learnerReviewFeedbackSchema.nullable(),
  errorMessage: z.string().nullable(),
})

export const adminProjectSubmissionSchema = learnerProjectSubmissionSchema.extend({
  /** Repository URL the learner submitted for review (admin-only). */
  repoUrl: z.string(),
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
