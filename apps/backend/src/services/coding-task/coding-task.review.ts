import OpenAI from 'openai'
import { env } from '../../env'
import { AppError, GENERIC_ERROR_MESSAGE } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { buildCodingTaskReviewPrompt } from './prompt.builder'

const CODING_TASK_MODEL = 'gpt-4.1-mini'
const logger = new Logger('CodingTaskReview')

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
        adminComment: {
          type: 'string',
          description:
            'A brief 1-2 sentence note for an admin reviewer (NOT shown to the student). If the submission failed, state plainly what is wrong. If it passed, say it is fine and optionally mention one area for improvement. Keep it under 300 characters.',
        },
      },
      required: ['passed', 'adminComment'],
    },
  },
}

export async function reviewCodingTask(
  submittedCode: string,
  language: string,
  aiExpectedResult: string,
  testCases: { title: string; description?: string | null }[],
): Promise<{ passed: boolean; adminComment: string }> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  const { system, user } = buildCodingTaskReviewPrompt(submittedCode, language, aiExpectedResult, testCases)

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: CODING_TASK_MODEL,
      response_format: codingTaskResponseFormat,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
  } catch (err) {
    logger.error('OpenAI chat completion failed', err, { language, model: CODING_TASK_MODEL })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  const text = completion.choices[0]?.message?.content
  if (!text) {
    logger.error('OpenAI returned an empty completion', undefined, { language, model: CODING_TASK_MODEL })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    logger.error('OpenAI response was not valid JSON', err, { language, preview: text.slice(0, 500) })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { passed?: unknown }).passed !== 'boolean' ||
    typeof (parsed as { adminComment?: unknown }).adminComment !== 'string'
  ) {
    logger.error('OpenAI response did not match schema', undefined, { language, parsed })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  const { passed, adminComment } = parsed as { passed: boolean; adminComment: string }
  return { passed, adminComment }
}
