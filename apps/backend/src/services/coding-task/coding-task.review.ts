import { getAiProvider } from '../ai'
import type { StructuredSchema } from '../ai'
import { AppError, GENERIC_ERROR_MESSAGE } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { buildCodingTaskReviewPrompt, buildSecondLayerReviewPrompt, type SecondLayerCase } from './prompt.builder'
import type { NormalizedUsage } from '../ai/usage.service'

const logger = new Logger('CodingTaskReview')

const codingTaskSchema: StructuredSchema = {
  name: 'coding_task_result',
  description: 'Pass/fail result for a student coding task submission.',
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
}

export async function reviewCodingTask(
  submittedCode: string,
  language: string,
  aiExpectedResult: string,
  testCases: { title: string; description?: string | null }[],
): Promise<{ passed: boolean; adminComment: string; usage: NormalizedUsage | null; model: string }> {
  const provider = getAiProvider()
  const { system, user } = buildCodingTaskReviewPrompt(submittedCode, language, aiExpectedResult, testCases)

  let result
  try {
    result = await provider.chatStructured({ model: provider.codingTaskModel, system, user, output: codingTaskSchema })
  } catch (err) {
    logger.error('AI coding-task review failed', err, { language, model: provider.codingTaskModel })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  if (!result.content) {
    logger.error('AI returned an empty completion', undefined, { language, model: provider.codingTaskModel })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(result.content)
  } catch (err) {
    logger.error('AI response was not valid JSON', err, { language, preview: result.content.slice(0, 500) })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { passed?: unknown }).passed !== 'boolean' ||
    typeof (parsed as { adminComment?: unknown }).adminComment !== 'string'
  ) {
    logger.error('AI response did not match schema', undefined, { language, parsed })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  const { passed, adminComment } = parsed as { passed: boolean; adminComment: string }
  return { passed, adminComment, usage: result.usage, model: result.model }
}

const secondLayerSchema: StructuredSchema = {
  name: 'coding_task_second_layer',
  description: 'Anti-cheat / sanity verdict on a submission whose tests already passed in the browser.',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      approved: {
        type: 'boolean',
        description:
          'True if the code looks like a genuine, general implementation. False ONLY when there is concrete evidence of cheating (e.g. hardcoded outputs that match the listed test inputs, no real algorithm) or an obvious correctness defect the limited test set might miss. Default to true when uncertain.',
      },
      adminComment: {
        type: 'string',
        description:
          'Brief 1-2 sentence note for an admin (NOT shown to the student). Under 300 characters. If approved, say "Solution is fine" and optionally add one improvement note. If not approved, state the concrete cheating signal you saw.',
      },
    },
    required: ['approved', 'adminComment'],
  },
}

export async function secondLayerReview(
  submittedCode: string,
  language: string,
  functionSignature: string,
  testCases: SecondLayerCase[],
): Promise<{ approved: boolean; adminComment: string; usage: NormalizedUsage | null; model: string }> {
  const provider = getAiProvider()
  const { system, user } = buildSecondLayerReviewPrompt(submittedCode, language, functionSignature, testCases)

  let result
  try {
    result = await provider.chatStructured({ model: provider.codingTaskModel, system, user, output: secondLayerSchema })
  } catch (err) {
    logger.error('AI second-layer review failed', err, { language, model: provider.codingTaskModel })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  if (!result.content) {
    logger.error('AI second-layer returned empty completion', undefined, { language })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(result.content)
  } catch (err) {
    logger.error('AI second-layer response not valid JSON', err, { language, preview: result.content.slice(0, 500) })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { approved?: unknown }).approved !== 'boolean' ||
    typeof (parsed as { adminComment?: unknown }).adminComment !== 'string'
  ) {
    logger.error('AI second-layer response did not match schema', undefined, { language, parsed })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }

  const { approved, adminComment } = parsed as { approved: boolean; adminComment: string }
  return { approved, adminComment, usage: result.usage, model: result.model }
}
