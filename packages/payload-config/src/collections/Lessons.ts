import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { formatSlug } from './hooks/formatSlug'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'module', 'order', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.type !== 'review_task') {
          return data
        }

        const summary = data.aiTaskSummary
        if (summary === undefined || summary === null || String(summary).trim() === '') {
          throw new APIError('AI task summary is required for review tasks.', 400)
        }

        const tasks = data.reviewGradingTasks
        if (!Array.isArray(tasks) || tasks.length === 0) {
          throw new APIError('Add at least one review grading task with points.', 400)
        }

        for (let i = 0; i < tasks.length; i++) {
          const row = tasks[i] as { points?: unknown; title?: unknown }
          const p = Number(row.points)
          if (!Number.isFinite(p) || p < 1) {
            throw new APIError(`Grading task ${i + 1}: points must be a number ≥ 1.`, 400)
          }
          if (row.title === undefined || row.title === null || String(row.title).trim() === '') {
            throw new APIError(`Grading task ${i + 1}: title is required.`, 400)
          }
        }

        const paths = data.reviewPaths
        if (!Array.isArray(paths) || paths.length === 0) {
          throw new APIError('Add at least one path under “Paths to review” (repo-relative file paths).', 400)
        }
        for (let i = 0; i < paths.length; i++) {
          const row = paths[i] as { path?: unknown }
          if (row.path === undefined || row.path === null || String(row.path).trim() === '') {
            throw new APIError(`Paths to review, row ${i + 1}: path is required.`, 400)
          }
        }

        return data
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (data?.type === 'test' && Array.isArray(data.questions)) {
          const maxPoints = data.questions.reduce((sum: number, q: { points?: number }) => sum + (q.points ?? 0), 0)
          data.maxPoints = maxPoints
        }
        if (data?.type === 'review_task' && Array.isArray(data.reviewGradingTasks)) {
          data.maxPoints = data.reviewGradingTasks.reduce(
            (sum: number, row: { points?: number }) => sum + (Number(row.points) || 0),
            0,
          )
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
      index: true,
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Lecture', value: 'lecture' },
        { label: 'Test', value: 'test' },
        { label: 'Coding Task', value: 'coding_task' },
        { label: 'Review Task', value: 'review_task' },
      ],
      defaultValue: 'lecture',
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Shown to students. For review tasks, use this as the learner-facing task description.',
      },
    },
    // --------------------------------------------------------------------------
    // Test Fields
    {
      name: 'questions',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'test',
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        {
          name: 'points',
          type: 'number',
          defaultValue: 5,
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              name: 'isCorrect',
              type: 'checkbox',
              defaultValue: false,
              access: {
                read: ({ req: { user } }) => Boolean(user),
              },
            },
          ],
        },
      ],
    },
    // --------------------------------------------------------------------------
    // Review Task Fields
    {
      name: 'aiTaskSummary',
      type: 'textarea',
      admin: {
        condition: (data) => data?.type === 'review_task',
        description: 'Short context for the AI reviewer (not shown to students via the public API).',
      },
    },
    {
      name: 'aiPossibleSolutions',
      type: 'textarea',
      admin: {
        condition: (data) => data?.type === 'review_task',
        description: 'Acceptable approaches / solution hints for the model (not shown to students via the public API).',
      },
    },
    {
      name: 'reviewGradingTasks',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'review_task',
        description:
          'Each row is one graded item. Total points must match lesson max points (auto-summed into Max points below).',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'points',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'criteria',
          type: 'textarea',
          admin: {
            description: 'What the AI should verify for this row (pass/fail per rubric).',
          },
        },
        {
          name: 'hideCriteriaFromLearner',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'When enabled, criteria text is not shown to learners in the app or API (still used for AI review). Use for spoilers or solution hints.',
          },
        },
        {
          name: 'isRequired',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Learner must earn full points on this row for the lesson to count as passed (when any row is required, overall pass depends only on required rows).',
          },
        },
      ],
    },
    {
      name: 'templateRepoUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'review_task',
        description: 'Optional GitHub URL of a starter/template repo for students to clone.',
      },
    },
    {
      name: 'reviewPaths',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'review_task',
        description:
          'Repo-relative paths of files the backend will fetch for review (one file per row; folder expansion is not supported yet).',
      },
      fields: [
        {
          name: 'path',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'maxPoints',
      type: 'number',
      defaultValue: 0,
      admin: {
        condition: (data) => data?.type === 'coding_task' || data?.type === 'review_task' || data?.type === 'test',
        description:
          'Tests: auto from question points. Review tasks: auto from grading tasks. Coding tasks: enter manually.',
      },
    },
  ],
}
