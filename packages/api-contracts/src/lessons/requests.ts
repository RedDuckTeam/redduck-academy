import { z } from 'zod'
import { slugField } from '../shared/slug'

export const submitTestBodySchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
  answers: z
    .record(
      z.string().min(1).max(64),
      z.array(z.string().max(64)).max(10),
    )
    .refine((r) => Object.keys(r).length <= 50, 'Too many answer keys'),
})

export const submitProjectBodySchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
  repoUrl: z.string().url(),
})

export const submitCodingTaskBodySchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
  code: z
    .string()
    .min(1, { message: 'Code cannot be empty.' })
    .max(30_000, { message: 'Your submission is too long. Please shorten your code and try again.' }),
  language: z.enum(['solidity', 'rust', 'typescript']),
  /** Browser test runner verdict; null when the lesson has no executable tests. */
  clientPassed: z.boolean().nullable(),
})

export type SubmitTestBody = z.infer<typeof submitTestBodySchema>
export type SubmitProjectBody = z.infer<typeof submitProjectBodySchema>
export type SubmitCodingTaskBody = z.infer<typeof submitCodingTaskBodySchema>
