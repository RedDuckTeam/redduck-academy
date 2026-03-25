import { createReadStream, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import OpenAI from 'openai'
import { env } from '../../env'
import { buildReviewFeedbackResponseFormat } from '../review/review-feedback-json-schema'
import { DEFAULT_MODEL } from './openai-client'

export function getOpenAiClient(): OpenAI {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY })
}

/**
 * Uploads a one-line JSONL batch job and creates an OpenAI Batch for chat completions.
 * @see https://platform.openai.com/docs/guides/batch
 */
export async function createOpenAiBatchForReview(
  prompt: string,
  submissionId: number,
  options: { criteriaCount: number },
): Promise<string> {
  const openai = getOpenAiClient()
  const line =
    JSON.stringify({
      custom_id: `submission-${submissionId}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: DEFAULT_MODEL,
        response_format: buildReviewFeedbackResponseFormat(options.criteriaCount),
        messages: [
          {
            role: 'system',
            content:
              'You are a course grader. Fill the response fields to match the lesson context in the user message. Output must follow the configured JSON schema exactly.',
          },
          { role: 'user', content: prompt },
        ],
      },
    }) + '\n'

  const path = join(tmpdir(), `review-batch-${submissionId}-${Date.now()}.jsonl`)
  writeFileSync(path, line, 'utf8')
  try {
    const uploaded = await openai.files.create({
      file: createReadStream(path),
      purpose: 'batch',
    })
    const batch = await openai.batches.create({
      input_file_id: uploaded.id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
    })
    return batch.id
  } finally {
    try {
      unlinkSync(path)
    } catch {
      //
    }
  }
}
