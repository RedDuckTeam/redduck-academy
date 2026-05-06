import { z } from 'zod'

export const courseInfoSchema = z.object({
  id: z.number(),
  title: z.string(),
  totalTasks: z.number(),
})

export type CourseInfo = z.infer<typeof courseInfoSchema>
