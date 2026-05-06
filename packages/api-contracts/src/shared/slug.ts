import { z } from 'zod'

export const slugField = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, or hyphens')

export const slugParamSchema = z.object({ slug: slugField })

export const courseLessonParamSchema = z.object({
  courseSlug: slugField,
  lessonSlug: slugField,
})

export type SlugParam = z.infer<typeof slugParamSchema>
export type CourseLessonParam = z.infer<typeof courseLessonParamSchema>
