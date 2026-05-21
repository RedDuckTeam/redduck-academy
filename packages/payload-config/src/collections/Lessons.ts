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
import { buildCodeBlock } from '../rich-text/code-block'

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
    blocks: [buildCodeBlock(CodeBlock)],
  }),
]

/**
 * Caller aliases recognised by the in-browser Solidity runner. Keep this list in
 * sync with `CALLER_ALIASES` in `apps/web/src/lib/code-runner/solidity/run-test-case.ts`.
 */
/** Hard cap on the number of steps per test case. Mirrors the worker-side check. */
const MAX_CASE_STEPS = 16

const SOLIDITY_CALLER_ALIASES = ['deployer', 'alice', 'bob', 'carol', 'dave']
const SOLIDITY_CALLER_HELP =
  'Optional msg.sender for the call. Use an @-prefixed alias (e.g. @alice / @bob / @deployer, or a fixture alias / @self), or a raw 0x-prefixed 40-hex address. Leave blank to use @deployer.'
const RAW_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const ALIAS_REF_RE = /^@[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Save-time validation for address-shaped fields (caller, postCheckCaller, target).
 * Accepts either an @-prefixed identifier (resolved at runtime against EOA aliases,
 * lesson fixtures, or @self) or a raw 0x-prefixed 40-hex address. Bare names are
 * rejected to keep the syntax consistent everywhere.
 *
 * The fixture-alias check happens at runtime — at save time we accept any
 * well-formed @identifier so admins can author cases that reference fixtures
 * declared in the same lesson without coupling validation order to field order.
 */
function assertValidCaller(value: unknown, casePrefix: string, fieldName: string): void {
  if (value === undefined || value === null) return
  if (typeof value !== 'string') {
    throw new APIError(`${casePrefix}: ${fieldName} must be a string.`, 400)
  }
  const trimmed = value.trim()
  if (trimmed === '') return
  if (ALIAS_REF_RE.test(trimmed)) return
  if (RAW_ADDRESS_RE.test(trimmed)) return
  throw new APIError(
    `${casePrefix}: ${fieldName} "${value}" is not a valid reference. Use an @-prefixed alias (e.g. @alice) or a 0x-prefixed 40-hex address.`,
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
        beforeDocumentControls: [
          '@/admin-components/copy-markdown-button#CopyMarkdownButton',
          '@/admin-components/lesson-preview-button#LessonPreviewButton',
        ],
      },
      views: {
        list: {
          Component: '@/admin-components/lessons-tree#LessonsTreeView',
        },
      },
    },
  },
  access: {
    // Hono backend reads lessons directly via Drizzle (bypassing Payload access), so locking
    // Payload's REST/admin read here only blocks anonymous requests to /api/payload/lessons,
    // which would otherwise leak spoiler fields (aiExpectedResult, aiTaskSummary, aiPossibleSolutions,
    // executableTestCases.expectedJson, solidityFixtures.source, etc.).
    read: ({ req: { user } }) => Boolean(user),
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

          // Solidity fixtures: peer contracts deployed before the student's.
          // Validate aliases here; source compilation / address resolution happens
          // at test-run time so admins can author cases that reference fixtures
          // declared in the same lesson without coupling field order.
          const solFixtures = data.solidityFixtures
          if (Array.isArray(solFixtures) && solFixtures.length > 0) {
            const seenAliases = new Set<string>()
            for (let i = 0; i < solFixtures.length; i++) {
              const row = solFixtures[i] as { alias?: unknown; source?: unknown }
              const fixturePrefix = `Solidity fixture ${i + 1}`
              if (typeof row.alias !== 'string' || row.alias.trim() === '') {
                throw new APIError(`${fixturePrefix}: alias is required.`, 400)
              }
              const alias = row.alias.trim()
              if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(alias)) {
                throw new APIError(
                  `${fixturePrefix}: alias "${alias}" must match /^[a-zA-Z_][a-zA-Z0-9_]*$/.`,
                  400,
                )
              }
              const aliasLower = alias.toLowerCase()
              if (SOLIDITY_CALLER_ALIASES.includes(aliasLower) || aliasLower === 'self') {
                throw new APIError(
                  `${fixturePrefix}: alias "${alias}" is reserved (deployer, alice, bob, carol, dave, self).`,
                  400,
                )
              }
              if (seenAliases.has(aliasLower)) {
                throw new APIError(`${fixturePrefix}: alias "${alias}" is duplicated.`, 400)
              }
              seenAliases.add(aliasLower)
              if (typeof row.source !== 'string' || row.source.trim() === '') {
                throw new APIError(`${fixturePrefix}: source is required.`, 400)
              }
            }
          }

          // Solidity path: each row is a `case` with an ordered list of steps.
          // A step can optionally carry an `expected` to assert that step's return.
          const solCases = data.solidityTestCases
          if (Array.isArray(solCases) && solCases.length > 0) {
            for (let i = 0; i < solCases.length; i++) {
              const row = solCases[i] as { steps?: unknown }
              const casePrefix = `Solidity test case ${i + 1}`

              if (!Array.isArray(row.steps) || row.steps.length === 0) {
                throw new APIError(`${casePrefix}: must have at least one step.`, 400)
              }
              if (row.steps.length > MAX_CASE_STEPS) {
                throw new APIError(
                  `${casePrefix}: exceeds ${MAX_CASE_STEPS}-step cap (got ${row.steps.length}).`,
                  400,
                )
              }
              for (let j = 0; j < row.steps.length; j++) {
                const step = row.steps[j] as {
                  functionName?: unknown
                  valueWei?: unknown
                  caller?: unknown
                  target?: unknown
                  expected?: unknown
                  expectedRevert?: unknown
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
                assertValidCaller(step.target, stepPrefix, 'target')
                assertValidCaller(step.caller, stepPrefix, 'caller')
                const expectedSet = typeof step.expected === 'string' && step.expected.trim() !== ''
                const expectedRevertSet =
                  typeof step.expectedRevert === 'string' && step.expectedRevert.trim() !== ''
                if (expectedSet && expectedRevertSet) {
                  throw new APIError(
                    `${stepPrefix}: cannot set both 'expected' (return-value compare) and 'expectedRevert' (revert-reason compare). Choose one.`,
                    400,
                  )
                }
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
        components: { RowLabel: '@/admin-components/test-case-row-label#TestCaseRowLabel' },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: { hidden: true },
        },
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
      name: 'solidityFixtures',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage === 'solidity',
        description:
          'Peer Solidity contracts deployed alongside the student\'s contract — used to set up scenarios ' +
          '(e.g. a mock ERC20 the student\'s vault interacts with). Each row gets an alias; tests reference ' +
          'the deployed address via @alias in callers, args, constructor args, and the step `target` field. ' +
          'Students never see these sources.',
      },
      fields: [
        {
          name: 'alias',
          type: 'text',
          required: true,
          admin: {
            description:
              'Identifier used to reference this fixture from tests (e.g. `mockToken` → `@mockToken`). ' +
              'Reserved names (deployer / alice / bob / carol / dave / self) are rejected.',
          },
        },
        {
          name: 'source',
          type: 'textarea',
          required: true,
          admin: { description: 'Full Solidity source for this fixture. May import @openzeppelin/contracts/...' },
        },
        {
          name: 'contractName',
          type: 'text',
          admin: {
            description:
              'Optional. Name of the contract inside `source` to deploy. Defaults to the first contract in the source.',
          },
        },
        {
          name: 'constructorArgs',
          type: 'array',
          admin: {
            description:
              'Constructor arguments for this fixture, one row per parameter. Values may reference earlier ' +
              'fixtures via @alias (deploy order = declaration order). `@self` is NOT available here — the ' +
              'student\'s contract is deployed after all fixtures.',
          },
          fields: [{ name: 'value', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'solidityTestCases',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'coding_task' && data?.codingLanguage === 'solidity',
        description:
          'Solidity test cases. Each row is a chain of calls (steps). Steps within a case share ' +
          'EVM state. Set a step\'s "expected" to assert that call\'s return value.',
        components: { RowLabel: '@/admin-components/test-case-row-label#TestCaseRowLabel' },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: { hidden: true },
        },
        {
          name: 'steps',
          type: 'array',
          required: true,
          maxRows: MAX_CASE_STEPS,
          admin: {
            description:
              `Ordered list of calls (max ${MAX_CASE_STEPS}). Each step is a function call against the freshly deployed contract.`,
            components: { RowLabel: '@/admin-components/test-case-row-label#StepRowLabel' },
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              admin: { hidden: true },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'functionName',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '60%',
                    components: { Field: '@/admin-components/abi-driven-test-case/function-select#FunctionSelect' },
                    description: 'Function to call. Picked from the target contract\'s ABI.',
                  },
                },
                {
                  name: 'target',
                  type: 'text',
                  admin: {
                    width: '40%',
                    description:
                      'Which deployed contract this step calls. Defaults to @self (the student\'s contract). ' +
                      'Use a fixture alias (e.g. @mockToken) to call a peer contract.',
                  },
                },
              ],
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
              type: 'row',
              fields: [
                {
                  name: 'valueWei',
                  type: 'text',
                  admin: {
                    width: '35%',
                    description: 'Optional ETH (in wei) sent as msg.value with this step. Decimal string. Example: `5` or `1000000000000000000`.',
                  },
                },
                {
                  name: 'caller',
                  type: 'text',
                  admin: {
                    width: '40%',
                    description: SOLIDITY_CALLER_HELP,
                  },
                },
                {
                  name: 'hideFromLearner',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    width: '25%',
                    description:
                      'When enabled, this step is not shown to learners in the test-case view. It still executes (state setup carries over to later steps).',
                  },
                },
              ],
            },
            {
              name: 'expected',
              type: 'text',
              admin: {
                components: { Field: '@/admin-components/abi-driven-test-case/typed-value-field#TypedValueField' },
                description:
                  'Optional. When set, the runner decodes this step\'s return value and compares against this. Typed per the function\'s return type. Leave blank for state-changing calls you don\'t need to assert. Mutually exclusive with `expectedRevert`.',
              },
            },
            {
              name: 'expectedRevert',
              type: 'text',
              admin: {
                description:
                  'Optional. When set, the runner expects this step to revert and checks that the decoded revert reason CONTAINS this string (case-sensitive substring match). Examples: `TransferFailed`, `not owner`, `Panic(17)`. Mutually exclusive with `expected`.',
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
