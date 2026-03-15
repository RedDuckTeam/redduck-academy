import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { db } from '../db'
import { eq } from 'drizzle-orm'
import { courses } from '../db/payload-schema'
import { listCoursesDesc, getCourseDesc } from '../descriptions/courses'
import { getLessonHandler } from '../modules/courses/lesson'
import { listCoursesInfoHandler } from '../modules/courses/general'
import { validateTestLessonHandler } from '../modules/courses/test-lesson'

const coursesApp = new Hono()

const slugParamSchema = z.object({ slug: z.string() })

coursesApp.get('/', listCoursesDesc, async (c) => {
  const allCourses = await db.query.courses.findMany({
    with: {
      modules: {
        with: {
          lessons: {
            columns: {
              id: true,
              title: true,
              slug: true,
              moduleId: true,
              order: true,
              type: true,
              maxPoints: true,
              updatedAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  })

  return c.json({ data: allCourses })
})

coursesApp.get('/info', ...listCoursesInfoHandler)

coursesApp.get('/:slug', getCourseDesc, validator('param', slugParamSchema), async (c) => {
  const { slug } = c.req.valid('param')

  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    with: {
      modules: {
        with: {
          lessons: true, // Return full lessons data including content for the specific course
        },
      },
    },
  })

  if (!course) {
    throw new HTTPException(404, { message: 'Course not found' })
  }

  return c.json({ data: course })
})

coursesApp.get('/:courseSlug/lessons/:lessonSlug', ...getLessonHandler)
coursesApp.post('/:courseSlug/lessons/:lessonSlug/validate', ...validateTestLessonHandler)

export type CoursesAppType = typeof coursesApp

export default coursesApp
