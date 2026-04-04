import OpenAI from 'openai'
import { env } from '../../env'
import { buildCodingTaskReviewPrompt } from './prompt.builder'

const CODING_TASK_MODEL = 'gpt-4.1-mini'

const codingTaskResponseFormat = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'coding_task_result',
    description: 'Pass/fail result for a student coding task submission.',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        passed: {
          type: 'boolean',
          description: 'True if the submitted code meets the expected result, false otherwise.',
        },
      },
      required: ['passed'],
    },
  },
}

export async function reviewCodingTask(
  submittedCode: string,
  language: string,
  aiExpectedResult: string,
  testCases: { title: string; description?: string | null }[],
): Promise<{ passed: boolean }> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  const { system, user } = buildCodingTaskReviewPrompt(submittedCode, language, aiExpectedResult, testCases)

  const completion = await openai.chat.completions.create({
    model: CODING_TASK_MODEL,
    response_format: codingTaskResponseFormat,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })

  const text = completion.choices[0]?.message?.content
  if (!text) {
    throw new Error('AI returned empty response')
  }

  const parsed = JSON.parse(text) as unknown
  if (typeof parsed !== 'object' || parsed === null || typeof (parsed as { passed?: unknown }).passed !== 'boolean') {
    throw new Error('AI response did not match expected schema')
  }

  return { passed: (parsed as { passed: boolean }).passed }
}
