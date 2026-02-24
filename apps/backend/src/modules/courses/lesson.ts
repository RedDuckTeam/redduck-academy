import { describeRoute, resolver, validator } from 'hono-openapi'
import { createFactory } from 'hono/factory'
import { z } from 'zod'
import { db } from '../../db'
import { eq } from 'drizzle-orm'
import { courses, lessons } from '../../db/payload-schema'

const factory = createFactory()

const getLessonSchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
})

export const getLessonHandler = factory.createHandlers(
  describeRoute({
    responses: {
      200: {
        description: 'Lesson data',
        content: {
          'application/json': { schema: resolver(getLessonSchema) },
        },
      },
    },
  }),
  validator('param', getLessonSchema),
  async (c) => {
    const { courseSlug, lessonSlug } = c.req.valid('param')
    try {
      const courseData = await db.query.courses.findFirst({
        where: eq(courses.slug, courseSlug),
        with: {
          modules: {
            with: {
              lessons: {
                where: eq(lessons.slug, lessonSlug),
                with: {
                  questions: {
                    with: {
                      options: {
                        columns: {
                          id: true,
                          order: true,
                          parentId: true,
                          label: true,
                          isCorrect: true, // we need it to calculate isMultipleChoices, we strip it later
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!courseData) {
        return c.json({ error: 'Course not found' }, 404)
      }

      // Find the actual lesson inside the returned tree
      let foundLesson = null
      for (const mod of courseData.modules) {
        if (mod.lessons && mod.lessons.length > 0) {
          foundLesson = mod.lessons[0]
          break
        }
      }

      if (!foundLesson) {
        return c.json({ error: 'Lesson not found' }, 404)
      }

      // Compute `isMultipleChoices` and remove `isCorrect` from options before returning
      if (foundLesson.questions) {
        foundLesson.questions = foundLesson.questions.map((q: any) => {
          const correctCount =
            q.options?.filter((o: any) => o.isCorrect).length || 0
          const isMultipleChoices = correctCount > 1

          return {
            ...q,
            isMultipleChoices,
            options: q.options?.map((o: any) => {
              const { isCorrect, ...safeOption } = o
              return safeOption
            }),
          }
        })
      }

      return c.json({ data: foundLesson })
    } catch (error) {
      console.error(
        `Error fetching lesson ${lessonSlug} for course ${courseSlug}:`,
        error,
      )
      return c.json({ error: 'Failed to fetch lesson' }, 500)
    }
  },
)
