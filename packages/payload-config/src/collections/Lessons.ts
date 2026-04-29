import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import {
  BoldFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

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
        if (data?.type === 'coding_task') {
          if (!data.codingLanguage) {
            throw new APIError('Coding language is required for coding tasks.', 400)
          }
          const expectedResult = data.aiExpectedResult
          if (expectedResult === undefined || expectedResult === null || String(expectedResult).trim() === '') {
            throw new APIError('AI expected result is required for coding tasks.', 400)
          }
          return data
        }

        if (data?.type !== 'review_task') {
          return data
        }

        const summary = data.aiTaskSummary
        if (summary === undefined || summary === null || String(summary).trim() === '') {
          throw new APIError('AI task summary is required for review tasks.', 400)
        }

        const tasks = data.reviewGradingTasks
        if (!Array.isArray(tasks) || tasks.length === 0) {
          throw new APIError('Add at least one review grading task.', 400)
        }

        for (let i = 0; i < tasks.length; i++) {
          const row = tasks[i] as { title?: unknown }
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
        {
          name: 'question',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: [
              ParagraphFeature(),
              BoldFeature(),
              ItalicFeature(),
              UnderlineFeature(),
              StrikethroughFeature(),
              InlineCodeFeature(),
              LinkFeature(),
              InlineToolbarFeature(),
            ],
          }),
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
    // Coding Task Fields
    {
      name: 'codingLanguage',
      type: 'select',
      admin: {
        condition: (data) => data?.type === 'coding_task',
        description: 'Language used in the Monaco editor and passed to the AI reviewer.',
      },
      options: [
        { label: 'Solidity', value: 'solidity' },
        { label: 'Rust', value: 'rust' },
        { label: 'TypeScript', value: 'typescript' },
      ],
    },
    {
      name: 'starterCode',
      type: 'textarea',
      admin: {
        condition: (data) => data?.type === 'coding_task',
        description: 'Initial code shown in the student\'s Monaco editor. Leave empty for a blank editor.',
      },
    },
    {
      name: 'aiExpectedResult',
      type: 'textarea',
      admin: {
        condition: (data) => data?.type === 'coding_task',
        description:
          'What the student\'s code should achieve — fed to the AI reviewer. NOT shown to students. Example: "The contract must protect against reentrancy using checks-effects-interactions or ReentrancyGuard."',
      },
    },
    {
      name: 'codingTestCases',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'coding_task',
        description: 'Visible test case descriptions shown to the student (like LeetCode examples). Also included in the AI review prompt as additional context.',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'description',
          type: 'textarea',
          admin: { description: 'Describe what this test case checks.' },
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
        description: 'Each row is one graded item the AI will evaluate as pass/fail.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
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
        description:
          'GitHub URL of the course repo students should fork (Fork button). When set, submissions must be a GitHub fork whose upstream matches this repository; the original repo URL alone is rejected.',
      },
    },
    {
      name: 'reviewPaths',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'review_task',
        description:
          'Repo-relative paths. Each row is one exact file or one glob; every matching file is fetched for AI review (duplicate paths across rows are deduped). ' +
          'Literals: e.g. src/Contract.sol, README.md. ' +
          'Single-segment * (does not cross /): e.g. contracts/*.sol, tests/*.spec.ts. ' +
          'Recursive **: e.g. contracts/**/*.sol, **/*.sol, **/Contract.sol. ' +
          '? and [a-z] character classes are supported. ' +
          'If a glob matches no files in the student repo, submission fails like a missing file.',
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
      name: 'isHidden',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'When checked, this lesson is excluded from the public API and all calculations.',
      },
    },
  ],
}
