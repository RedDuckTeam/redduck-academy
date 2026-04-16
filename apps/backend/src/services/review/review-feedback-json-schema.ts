/**
 * Strict JSON Schema for {@link ReviewFeedback} — used with Chat Completions
 * `response_format: { type: 'json_schema', json_schema: ... }` so the API enforces shape (no markdown).
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */
export function buildReviewFeedbackResponseFormat(criteriaCount: number) {
  const n = Math.max(1, criteriaCount)
  return {
    type: 'json_schema' as const,
    json_schema: {
      name: 'review_feedback',
      description: 'Structured grading result for a student project submission.',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          lessonPassed: {
            type: 'boolean',
            description:
              'Your judgment: true if and only if the submission meets the lesson pass bar. Rows with requiredToPass true in the rubric are mandatory—only set true if those are satisfied in your assessment. Optional rows affect score and feedback but do not by themselves determine pass/fail unless the work is clearly insufficient overall.',
          },
          summary: {
            type: 'string',
            description: 'Short overall summary of the review; if lessonPassed is false, say what is missing.',
          },
          criteria: {
            type: 'array',
            minItems: n,
            maxItems: n,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                taskId: { type: 'string', description: 'Stable id for this rubric row (Payload grading task id).' },
                name: {
                  type: 'string',
                  description:
                    'Must exactly match the rubric task title for this taskId (same string as the title in the rubric XML).',
                },
                passed: {
                  type: 'boolean',
                  description:
                    "Your judgment for this row: true if the student met this criterion's expectations well enough for credit.",
                },
                comment: { type: 'string', description: 'Brief feedback for this criterion.' },
              },
              required: ['taskId', 'name', 'passed', 'comment'],
            },
          },
        },
        required: ['lessonPassed', 'summary', 'criteria'],
      },
    },
  }
}
