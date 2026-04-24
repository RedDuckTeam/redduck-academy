import { z } from 'zod'

const slugField = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, or hyphens')

export const slugParamSchema = z.object({ slug: slugField })

export const courseLessonParamSchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
})
