import { z } from 'zod'

export const submitTestResponseSchema = z.object({ success: z.boolean() })
export const submitProjectResponseSchema = z.object({ success: z.literal(true) })
export const submitCodingTaskResponseSchema = z.object({ passed: z.boolean() })
export const markCompletedResponseSchema = z.object({ success: z.boolean() })

export type SubmitTestResponse = z.infer<typeof submitTestResponseSchema>
export type SubmitProjectResponse = z.infer<typeof submitProjectResponseSchema>
export type SubmitCodingTaskResponse = z.infer<typeof submitCodingTaskResponseSchema>
export type MarkCompletedResponse = z.infer<typeof markCompletedResponseSchema>
