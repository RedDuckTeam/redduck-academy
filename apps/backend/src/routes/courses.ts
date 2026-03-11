import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { db } from '../db'
import { eq } from 'drizzle-orm'
import { courses } from '../db/payload-schema'
import { listCoursesDesc, getCourseDesc } from '../descriptions/courses'
import { getLessonHandler } from '../modules/courses/lesson'
import { validateTestLessonHandler } from '../modules/courses/test-lesson'

const coursesApp = new Hono()

const slugParamSchema = z.object({ slug: z.string() })

coursesApp.get('/', listCoursesDesc, async (c) => {
  try {
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
                language: true,
                maxScore: true,
                updatedAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    return c.json({ data: allCourses })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return c.json({ error: 'Failed to fetch courses' }, 500)
  }
})

coursesApp.get(
  '/:slug',
  getCourseDesc,
  validator('param', slugParamSchema),
  async (c) => {
    const { slug } = c.req.valid('param')

    try {
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
        return c.json({ error: 'Course not found' }, 404)
      }

      return c.json({ data: course })
    } catch (error) {
      console.error(`Error fetching course ${slug}:`, error)
      return c.json({ error: 'Failed to fetch course' }, 500)
    }
  },
)

coursesApp.get('/:courseSlug/lessons/:lessonSlug', ...getLessonHandler)
coursesApp.post(
  '/:courseSlug/lessons/:lessonSlug/validate',
  ...validateTestLessonHandler,
)

export type CoursesAppType = typeof coursesApp

export default coursesApp
