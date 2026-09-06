import { z } from 'zod'

export const createProposalResponseSchema = z.object({
  prUrl: z.string().url(),
  prNumber: z.number().int().positive(),
  branch: z.string().min(1),
})

export type CreateProposalResponse = z.infer<typeof createProposalResponseSchema>
