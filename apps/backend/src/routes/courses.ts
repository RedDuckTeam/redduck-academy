import { Hono } from 'hono'
import { db } from '../db'
import { eq, sql } from 'drizzle-orm'
import { courses } from '../db/payload-schema'
import {
  getLessonHandler,
  validateTestLessonHandler,
} from '../modules/courses/test-lesson'

const coursesApp = new Hono()

coursesApp.get('/', async (c) => {
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

coursesApp.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

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
})

coursesApp.get('/:courseSlug/lessons/:lessonSlug', getLessonHandler)
coursesApp.post(
  '/:courseSlug/lessons/:lessonSlug/validate',
  validateTestLessonHandler,
)

export type CoursesAppType = typeof coursesApp

export default coursesApp
