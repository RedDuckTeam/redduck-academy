import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

export const getLessonDesc = describeRoute({
  summary: 'Get lesson by slug',
  description:
    'Returns a single lesson with questions and options. Strips correct answers from options for test lessons. For review_task lessons, includes reviewGradingTasks (title, points, isRequired, optional criteria); rows marked hide criteria in admin omit criteria in the payload and set criteriaHidden.',
  tags: ['Lessons'],
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

export const submitTestDesc = describeRoute({
  summary: 'Submit test lesson answers',
  description:
    'Submits user answers for a test lesson by courseSlug and lessonSlug. Validates answers, calculates score, marks lesson as completed, and adds points. Re-submissions are ignored. Use GET /api/user/lessons/:courseSlug/:lessonSlug to fetch results including correct answers.',
  tags: ['Lessons'],
  responses: {
    200: {
      description: 'Submission accepted',
      content: {
        'application/json': {
          schema: resolver(z.object({ success: z.boolean() })),
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

export const submitProjectDesc = describeRoute({
  summary: 'Submit review task repository URL',
  description:
    'Creates a user lesson row if needed, stores a project submission, and starts an OpenAI Batch job. Idempotent: same repo URL with a batch already created returns success without duplicating the job; pending submission without a batch retries batch creation.',
  tags: ['Lessons'],
  responses: {
    200: {
      description: 'Submission queued for AI batch, or already queued (idempotent)',
      content: {
        'application/json': {
          schema: resolver(z.object({ success: z.literal(true) })),
        },
      },
    },
    400: {
      description: 'Lesson is not a review task or no attempts left',
      content: { 'application/json': { schema: errorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Course or lesson not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    409: {
      description: 'Another repository URL is already being reviewed for this lesson',
      content: { 'application/json': { schema: errorSchema } },
    },
    502: {
      description: 'OpenAI batch creation failed',
      content: { 'application/json': { schema: errorSchema } },
    },
    503: {
      description: 'AI not configured',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const submitCodingTaskDesc = describeRoute({
  summary: 'Submit coding task code for AI review',
  description:
    'Submits student code for a coding_task lesson. The AI reviews the code synchronously and returns a pass/fail result immediately. Decrements attemptsLeft on each call.',
  tags: ['Lessons'],
  responses: {
    200: {
      description: 'Review result with pass/fail and remaining attempts',
      content: {
        'application/json': {
          schema: resolver(z.object({ passed: z.boolean(), attemptsLeft: z.number() })),
        },
      },
    },
    400: {
      description: 'Lesson is not a coding task or no attempts left',
      content: { 'application/json': { schema: errorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Course or lesson not found',
      content: { 'application/json': { schema: errorSchema } },
    },
    502: {
      description: 'AI review failed',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const markLessonAsCompletedDesc = describeRoute({
  summary: 'Mark lecture as completed',
  description:
    'Marks a lecture lesson as completed for the authenticated user. Only lectures can be marked; tests and other types must be completed through their respective flows.',
  tags: ['Lessons'],
  responses: {
    200: {
      description: 'Lesson marked as completed',
      content: {
        'application/json': {
          schema: resolver(z.object({ success: z.boolean() })),
        },
      },
    },
    400: {
      description: 'Lesson is not a lecture',
      content: { 'application/json': { schema: errorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorSchema } },
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
