import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

const courseInfoSchema = z.object({
  id: z.number(),
  title: z.string(),
  totalPoints: z.number(),
  totalTasks: z.number(),
})

export const listCoursesInfoDesc = describeRoute({
  summary: 'List courses info',
  description:
    'Returns a lightweight array of courses with id, title, total points, and task count (non-lecture lessons).',
  tags: ['Courses'],
  responses: {
    200: {
      description: 'List of course info',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.array(courseInfoSchema) })),
        },
      },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const listCoursesDesc = describeRoute({
  summary: 'List all courses',
  description:
    'Returns all courses with their modules and lesson metadata (excluding lesson content).',
  tags: ['Courses'],
  responses: {
    200: {
      description: 'List of courses',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.array(z.any()) })),
        },
      },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getCourseDesc = describeRoute({
  summary: 'Get course by slug',
  description:
    'Returns a single course by slug with full module and lesson data including content.',
  tags: ['Courses'],
  responses: {
    200: {
      description: 'Course data',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.any() })),
        },
      },
    },
    404: {
      description: 'Course not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const getLessonDesc = describeRoute({
  summary: 'Get lesson by slug',
  description:
    'Returns a single lesson with questions and options. Strips correct answers from options for test lessons.',
  tags: ['Courses', 'Lessons'],
  responses: {
    200: {
      description: 'Lesson data with questions and options',
      content: {
        'application/json': {
          schema: resolver(z.object({ data: z.any() })),
        },
      },
    },
    404: {
      description: 'Course or lesson not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const validateTestLessonDesc = describeRoute({
  summary: 'Validate test lesson answers',
  description:
    'Submits user answers for a test lesson, calculates score, and records completion. Requires authentication.',
  tags: ['Courses', 'Lessons'],
  responses: {
    200: {
      description: 'Validation result with score and correct answers',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              score: z.number(),
              correctAnswers: z.record(z.string(), z.array(z.string())),
            }),
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Course, lesson not found, or lesson is not a test',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})
