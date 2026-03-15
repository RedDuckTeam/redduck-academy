import { createFactory } from 'hono/factory'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { validateTestLessonDesc } from '../../descriptions/courses'
import { auth } from '../../lib/auth'
import { CoursesService } from '../../services/courses.service'
import { HTTPException } from 'hono/http-exception'

const factory = createFactory()

const courseLessonParamSchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
})

/** User answers: question ID -> array of selected option IDs */
const validateAnswersSchema = z.record(z.string(), z.array(z.string()))

export const validateTestLessonHandler = factory.createHandlers(
  validateTestLessonDesc,
  validator('param', courseLessonParamSchema),
  validator('json', validateAnswersSchema),
  async (c) => {
    const { courseSlug, lessonSlug } = c.req.valid('param')
    const userAnswers = c.req.valid('json')

    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session || !session.user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { score, correctAnswers } = await CoursesService.validateTestLesson(
      courseSlug,
      lessonSlug,
      session.user.id,
      userAnswers,
    )

    return c.json({
      score,
      correctAnswers,
    })
  },
)
