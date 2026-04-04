import { z } from 'zod'

export const slugParamSchema = z.object({ slug: z.string() })

export const courseLessonParamSchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
})
