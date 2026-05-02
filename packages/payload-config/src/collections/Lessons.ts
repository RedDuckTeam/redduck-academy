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

          const execCases = data.executableTestCases
          if (Array.isArray(execCases) && execCases.length > 0) {
            if (!data.functionSignature || String(data.functionSignature).trim() === '') {
              throw new APIError(
                'Function signature is required when executable test cases are defined.',
                400,
              )
            }
            for (let i = 0; i < execCases.length; i++) {
              const row = execCases[i] as {
                inputJson?: unknown
                expectedJson?: unknown
                valueWei?: unknown
                postCheckJson?: unknown
              }
              const inputRaw = typeof row.inputJson === 'string' ? row.inputJson : ''
              const expectedRaw = typeof row.expectedJson === 'string' ? row.expectedJson : ''
              try {
                JSON.parse(inputRaw)
              } catch {
                throw new APIError(`Executable test case ${i + 1}: input is not valid JSON.`, 400)
              }
              try {
                JSON.parse(expectedRaw)
              } catch {
                throw new APIError(`Executable test case ${i + 1}: expected is not valid JSON.`, 400)
              }
              if (typeof row.valueWei === 'string' && row.valueWei.trim() !== '') {
                try {
                  const v = BigInt(row.valueWei.trim())
                  if (v < 0n) throw new Error('negative')
                } catch {
                  throw new APIError(
                    `Executable test case ${i + 1}: valueWei must be a non-negative integer (decimal string).`,
                    400,
                  )
                }
              }
              if (typeof row.postCheckJson === 'string' && row.postCheckJson.trim() !== '') {
                let parsed: unknown
                try {
                  parsed = JSON.parse(row.postCheckJson)
                } catch {
                  throw new APIError(`Executable test case ${i + 1}: postCheckJson is not valid JSON.`, 400)
                }
                if (
                  !parsed ||
                  typeof parsed !== 'object' ||
                  typeof (parsed as { signature?: unknown }).signature !== 'string' ||
                  !Array.isArray((parsed as { args?: unknown }).args)
                ) {
                  throw new APIError(
                    `Executable test case ${i + 1}: postCheckJson must be {"signature": string, "args": array}.`,
                    400,
                  )
                }
              }
            }
          }

          if (data.codingLanguage === 'solidity' && data.solidityConstructorArgs) {
            const raw = String(data.solidityConstructorArgs).trim()
            if (raw !== '') {
              let parsed: unknown
              try {
                parsed = JSON.parse(raw)
              } catch {
                throw new APIError('Solidity constructor args must be valid JSON.', 400)
              }
              if (!Array.isArray(parsed)) {
                throw new APIError('Solidity constructor args must be a JSON array.', 400)
              }
            }
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
    {
      name: 'functionSignature',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'coding_task',
        description:
          'Required when executable test cases are defined. ' +
          'TS form: `solve(nums: number[], target: number): number[]`. ' +
          'Solidity form: `function add(uint256 a, uint256 b) external view returns (uint256)`.',
      },
    },
    {
      name: 'solidityContractName',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage === 'solidity',
        description: 'Optional. Name of the contract to deploy. Defaults to the first contract in the source.',
      },
    },
    {
      name: 'solidityConstructorArgs',
      type: 'textarea',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage === 'solidity',
        description: 'Optional JSON array of constructor arguments, e.g. `["0x1234...", "1000"]`.',
      },
    },
    {
      name: 'executableTestCases',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'coding_task',
        description:
          'Each row runs in the browser against the student\'s code. ' +
          '`inputJson` is a JSON array of arguments; `expectedJson` is the expected return value as JSON. ' +
          'For Solidity uint256/int256/bytes/address, use string-encoded values. ' +
          'Leave this entire array empty to keep AI-only grading (legacy mode).',
      },
      fields: [
        {
          name: 'inputJson',
          type: 'textarea',
          required: true,
          admin: { description: 'JSON array of args. Example: `[[2,7,11,15], 9]`.' },
        },
        {
          name: 'expectedJson',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'Expected return value as JSON. Example: `[0, 1]` or `"42"`. ' +
              'When `postCheckJson` is set, this is compared to the post-check view return instead of the main call return.',
          },
        },
        {
          name: 'valueWei',
          type: 'text',
          admin: {
            description:
              'Optional. Solidity only. ETH (in wei) sent with the main call as msg.value. Decimal string. Example: `"5"` or `"1000000000000000000"`.',
          },
        },
        {
          name: 'postCheckJson',
          type: 'textarea',
          admin: {
            description:
              'Optional. Solidity only. JSON `{"signature": "function tokensSold() external view returns (uint256)", "args": []}`. ' +
              'When set, the runner calls this view AFTER the main call and compares its return to `expectedJson`.',
          },
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
