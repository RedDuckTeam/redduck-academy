import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import {
  BlocksFeature,
  BoldFeature,
  CodeBlock,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { formatSlug } from './hooks/formatSlug'
import { rootEditorFeatures } from '../editor-features'

const testQuestionLexicalFeatures = [
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  StrikethroughFeature(),
  InlineCodeFeature(),
  LinkFeature(),
  InlineToolbarFeature(),
  BlocksFeature({
    blocks: [
      CodeBlock({
        slug: 'code',
        defaultLanguage: 'typescript',
        languages: {
          typescript: 'TypeScript',
          rust: 'Rust',
          solidity: 'Solidity',
        },
      }),
    ],
  }),
]

/**
 * Caller aliases recognised by the in-browser Solidity runner. Keep this list in
 * sync with `CALLER_ALIASES` in `apps/web/src/lib/code-runner/solidity/run-test-case.ts`.
 */
/** Hard cap on the number of steps per sequence test case. Mirrors the worker-side check. */
const MAX_SEQUENCE_STEPS = 16

const SOLIDITY_CALLER_ALIASES = ['default', 'alice', 'bob', 'carol', 'dave']
const SOLIDITY_CALLER_HELP =
  'Optional msg.sender for the call. Use a named alias (default, alice, bob, carol, dave) or a raw 0x-prefixed 40-hex address. Leave blank to use the default caller.'
const RAW_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

function assertValidCaller(value: unknown, casePrefix: string, fieldName: string): void {
  if (value === undefined || value === null) return
  if (typeof value !== 'string') {
    throw new APIError(`${casePrefix}: ${fieldName} must be a string.`, 400)
  }
  const trimmed = value.trim()
  if (trimmed === '') return
  if (SOLIDITY_CALLER_ALIASES.includes(trimmed.toLowerCase())) return
  if (RAW_ADDRESS_RE.test(trimmed)) return
  throw new APIError(
    `${casePrefix}: ${fieldName} "${value}" is not a known alias (${SOLIDITY_CALLER_ALIASES.join(', ')}) or 0x-prefixed 40-hex address.`,
    400,
  )
}

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'module', 'order', 'updatedAt'],
    components: {
      edit: {
        beforeDocumentControls: ['@/admin-components/copy-markdown-button#CopyMarkdownButton'],
      },
      views: {
        list: {
          Component: '@/admin-components/lessons-tree#LessonsTreeView',
        },
      },
    },
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

          // TS path: existing executableTestCases (inputJson/expectedJson)
          const execCases = data.executableTestCases
          if (Array.isArray(execCases) && execCases.length > 0) {
            if (!data.functionSignature || String(data.functionSignature).trim() === '') {
              throw new APIError(
                'Function signature is required when executable test cases are defined.',
                400,
              )
            }
            for (let i = 0; i < execCases.length; i++) {
              const row = execCases[i] as { inputJson?: unknown; expectedJson?: unknown }
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
            }
          }

          // Solidity path: new blocks-based solidityTestCases
          const solCases = data.solidityTestCases
          if (Array.isArray(solCases) && solCases.length > 0) {
            for (let i = 0; i < solCases.length; i++) {
              const row = solCases[i] as {
                blockType?: unknown
                functionName?: unknown
                valueWei?: unknown
                caller?: unknown
                postCheckFunctionName?: unknown
                postCheckCaller?: unknown
                steps?: unknown
                assertion?: unknown
              }
              const casePrefix = `Solidity test case ${i + 1}`

              if (row.blockType === 'sequence') {
                if (!Array.isArray(row.steps) || row.steps.length === 0) {
                  throw new APIError(`${casePrefix}: sequence needs at least one step.`, 400)
                }
                if (row.steps.length > MAX_SEQUENCE_STEPS) {
                  throw new APIError(
                    `${casePrefix}: sequence exceeds ${MAX_SEQUENCE_STEPS}-step cap (got ${row.steps.length}).`,
                    400,
                  )
                }
                for (let j = 0; j < row.steps.length; j++) {
                  const step = row.steps[j] as {
                    functionName?: unknown
                    valueWei?: unknown
                    caller?: unknown
                  }
                  const stepPrefix = `${casePrefix}, step ${j + 1}`
                  if (typeof step.functionName !== 'string' || step.functionName.trim() === '') {
                    throw new APIError(`${stepPrefix}: functionName is required.`, 400)
                  }
                  if (typeof step.valueWei === 'string' && step.valueWei.trim() !== '') {
                    try {
                      const v = BigInt(step.valueWei.trim())
                      if (v < 0n) throw new Error('negative')
                    } catch {
                      throw new APIError(
                        `${stepPrefix}: valueWei must be a non-negative integer (decimal string).`,
                        400,
                      )
                    }
                  }
                  assertValidCaller(step.caller, stepPrefix, 'caller')
                }
                if (row.assertion !== 'lastReturn' && row.assertion !== 'postCheck') {
                  throw new APIError(
                    `${casePrefix}: assertion must be 'lastReturn' or 'postCheck'.`,
                    400,
                  )
                }
                if (row.assertion === 'postCheck') {
                  if (typeof row.postCheckFunctionName !== 'string' || row.postCheckFunctionName.trim() === '') {
                    throw new APIError(
                      `${casePrefix}: postCheckFunctionName is required when assertion is 'postCheck'.`,
                      400,
                    )
                  }
                  assertValidCaller(row.postCheckCaller, casePrefix, 'postCheckCaller')
                }
                continue
              }

              if (typeof row.functionName !== 'string' || row.functionName.trim() === '') {
                throw new APIError(`${casePrefix}: functionName is required.`, 400)
              }
              if (typeof row.valueWei === 'string' && row.valueWei.trim() !== '') {
                try {
                  const v = BigInt(row.valueWei.trim())
                  if (v < 0n) throw new Error('negative')
                } catch {
                  throw new APIError(
                    `${casePrefix}: valueWei must be a non-negative integer (decimal string).`,
                    400,
                  )
                }
              }
              assertValidCaller(row.caller, casePrefix, 'caller')
              if (row.blockType === 'postCheckAssertion') {
                if (typeof row.postCheckFunctionName !== 'string' || row.postCheckFunctionName.trim() === '') {
                  throw new APIError(
                    `${casePrefix}: postCheckFunctionName is required for post-check assertions.`,
                    400,
                  )
                }
                assertValidCaller(row.postCheckCaller, casePrefix, 'postCheckCaller')
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
  endpoints: [
    {
      path: '/markdown/to-lexical',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const body = (await req.json?.()) as { markdown?: string } | undefined
        const markdown = body?.markdown ?? ''
        const editorConfig = await editorConfigFactory.fromFeatures({
          config: req.payload.config,
          features: rootEditorFeatures,
        })
        return Response.json(convertMarkdownToLexical({ editorConfig, markdown }))
      },
    },
    {
      path: '/markdown/from-lexical',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const body = (await req.json?.()) as { data?: unknown } | undefined
        const data = body?.data
        if (!data) return Response.json({ markdown: '' })
        const editorConfig = await editorConfigFactory.fromFeatures({
          config: req.payload.config,
          features: rootEditorFeatures,
        })
        return Response.json({ markdown: convertLexicalToMarkdown({ data: data as never, editorConfig }) })
      },
    },
  ],
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
          editor: lexicalEditor({ features: testQuestionLexicalFeatures }),
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'richText',
              required: true,
              editor: lexicalEditor({ features: testQuestionLexicalFeatures }),
            },
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
      name: 'functionSignature',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage !== 'solidity',
        description:
          'Required when executable test cases are defined. ' +
          'TS form: `solve(nums: number[], target: number): number[]`.',
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
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage === 'solidity',
        description:
          'Constructor arguments. One row per parameter, in declaration order. ' +
          'Each value is a canonical string per type (e.g. `5`, `0x000…c0de`, `true`).',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: {
            components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
          },
        },
      ],
    },
    {
      name: 'executableTestCases',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage !== 'solidity',
        description:
          'TypeScript test cases. Each row runs in the browser against the student\'s code. ' +
          '`inputJson` is a JSON array of arguments; `expectedJson` is the expected return value as JSON. ' +
          'Leave empty to keep AI-only grading (legacy mode).',
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
          admin: { description: 'Expected return value as JSON. Example: `[0, 1]` or `"42"`.' },
        },
      ],
    },
    {
      name: 'solidityTestCases',
      type: 'blocks',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage === 'solidity',
        description:
          'Solidity test cases. Each block runs in the browser against the student\'s code. ' +
          'Function names and argument types are driven by the compiled ABI of the starter code.',
      },
      blocks: [
        {
          slug: 'returnAssertion',
          labels: { singular: 'Return assertion', plural: 'Return assertions' },
          fields: [
            {
              name: 'functionName',
              type: 'text',
              required: true,
              admin: {
                components: { Field: '@/admin-components/abi-driven-test-case/function-select#FunctionSelect' },
                description: 'Function to call. Choose from the contract\'s ABI.',
              },
            },
            {
              name: 'args',
              type: 'array',
              admin: { description: 'One row per function argument, in declaration order.' },
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  admin: {
                    components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                  },
                },
              ],
            },
            {
              name: 'valueWei',
              type: 'text',
              admin: {
                description: 'Optional ETH (in wei) sent as msg.value. Decimal string. Example: `5` or `1000000000000000000`.',
              },
            },
            {
              name: 'caller',
              type: 'text',
              admin: { description: SOLIDITY_CALLER_HELP },
            },
            {
              name: 'expected',
              type: 'text',
              required: true,
              admin: {
                components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                description: 'Expected return value, typed per the function\'s return type.',
              },
            },
          ],
        },
        {
          slug: 'postCheckAssertion',
          labels: { singular: 'Post-check assertion', plural: 'Post-check assertions' },
          fields: [
            {
              name: 'functionName',
              type: 'text',
              required: true,
              admin: {
                components: { Field: '@/admin-components/abi-driven-test-case/function-select#FunctionSelect' },
                description: 'Main function to call (typically state-changing).',
              },
            },
            {
              name: 'args',
              type: 'array',
              admin: { description: 'One row per function argument.' },
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  admin: {
                    components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                  },
                },
              ],
            },
            {
              name: 'valueWei',
              type: 'text',
              admin: {
                description: 'Optional ETH (in wei) sent as msg.value with the main call.',
              },
            },
            {
              name: 'caller',
              type: 'text',
              admin: { description: SOLIDITY_CALLER_HELP },
            },
            {
              name: 'postCheckFunctionName',
              type: 'text',
              required: true,
              admin: {
                components: { Field: '@/admin-components/abi-driven-test-case/post-check-function-select#PostCheckFunctionSelect' },
                description: 'View/pure function called AFTER the main call to verify state.',
              },
            },
            {
              name: 'postCheckArgs',
              type: 'array',
              admin: { description: 'One row per post-check function argument.' },
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  admin: {
                    components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                  },
                },
              ],
            },
            {
              name: 'postCheckCaller',
              type: 'text',
              admin: {
                description: `${SOLIDITY_CALLER_HELP} Defaults to the main call's caller.`,
              },
            },
            {
              name: 'expected',
              type: 'text',
              required: true,
              admin: {
                components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                description: 'Expected return of the post-check view function.',
              },
            },
          ],
        },
        {
          slug: 'sequence',
          labels: { singular: 'Sequence (multi-step)', plural: 'Sequences (multi-step)' },
          fields: [
            {
              name: 'steps',
              type: 'array',
              required: true,
              maxRows: MAX_SEQUENCE_STEPS,
              admin: {
                description: `Chained calls within one case (max ${MAX_SEQUENCE_STEPS}). Steps share EVM state; each gets a fresh case-level deploy.`,
              },
              fields: [
                {
                  name: 'functionName',
                  type: 'text',
                  required: true,
                  admin: {
                    components: { Field: '@/admin-components/abi-driven-test-case/function-select#FunctionSelect' },
                    description: 'Function to call at this step. Picked from the compiled ABI.',
                  },
                },
                {
                  name: 'args',
                  type: 'array',
                  admin: { description: 'One row per function argument, in declaration order.' },
                  fields: [
                    {
                      name: 'value',
                      type: 'text',
                      required: true,
                      admin: {
                        components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                      },
                    },
                  ],
                },
                {
                  name: 'valueWei',
                  type: 'text',
                  admin: {
                    description: 'Optional ETH (in wei) sent as msg.value with this step. Decimal string.',
                  },
                },
                {
                  name: 'caller',
                  type: 'text',
                  admin: { description: SOLIDITY_CALLER_HELP },
                },
              ],
            },
            {
              name: 'assertion',
              type: 'radio',
              required: true,
              defaultValue: 'lastReturn',
              options: [
                { label: 'Compare last step\'s return value', value: 'lastReturn' },
                { label: 'Run a view function after the chain', value: 'postCheck' },
              ],
              admin: { description: 'How the test is judged after all steps run.' },
            },
            {
              name: 'postCheckFunctionName',
              type: 'text',
              admin: {
                condition: (_, sibling) => (sibling as { assertion?: unknown })?.assertion === 'postCheck',
                components: {
                  Field: '@/admin-components/abi-driven-test-case/post-check-function-select#PostCheckFunctionSelect',
                },
                description: 'View/pure function called AFTER the sequence to verify state.',
              },
            },
            {
              name: 'postCheckArgs',
              type: 'array',
              admin: {
                condition: (_, sibling) => (sibling as { assertion?: unknown })?.assertion === 'postCheck',
                description: 'One row per post-check function argument.',
              },
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  admin: {
                    components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                  },
                },
              ],
            },
            {
              name: 'postCheckCaller',
              type: 'text',
              admin: {
                condition: (_, sibling) => (sibling as { assertion?: unknown })?.assertion === 'postCheck',
                description: `${SOLIDITY_CALLER_HELP} Defaults to the final step's caller.`,
              },
            },
            {
              name: 'expected',
              type: 'text',
              required: true,
              admin: {
                components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                description:
                  'Expected return value. Typed against the last step\'s return (when assertion=lastReturn) or the post-check function\'s return (when assertion=postCheck).',
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
