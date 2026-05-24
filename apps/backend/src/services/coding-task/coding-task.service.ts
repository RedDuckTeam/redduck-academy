import { LessonsService } from '../lessons/lessons.service'
import { reviewCodingTask, secondLayerReview, CODING_TASK_MODEL } from './coding-task.review'
import { CodingTaskRepository } from './coding-task.repository'
import { CodingTaskRateLimitService } from '../rate-limit/coding-task-rate-limit.service'
import { recordAiUsage, type AiSubmissionType, type NormalizedUsage } from '../ai/usage.service'
import { AppError } from '../../lib/errors'
import {
  deserializeExecutableCases,
  deserializeSolidityCases,
  type TsExecutableCaseRow,
  type SolidityCaseRow,
  type SolidityFixtureRow,
} from './utils/executable-cases'
import { packVerdictComment } from './utils/verdict-comment'

interface VerdictResolution {
  passed: boolean
  aiComment: string
  // Present only when an AI call was made (skipped for short-circuit fails).
  usage?: NormalizedUsage | null
  submissionType?: AiSubmissionType
}

export class CodingTaskService {
  static async submitCode(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    submittedCode: string,
    language: string,
    clientPassed: boolean | null,
    ipAddress: string,
  ): Promise<{ passed: boolean }> {
    const lesson = await LessonsService.getCodingTaskLesson(courseSlug, lessonSlug)

    const rateLimit = await CodingTaskRateLimitService.check(userId, ipAddress, lesson.id)
    if (!rateLimit.allowed) {
      throw new AppError(429, 'Rate limit exceeded', {
        reason: rateLimit.reason,
        retryAfterMs: rateLimit.retryAfterMs,
        ...(rateLimit.resetAt ? { resetAt: rateLimit.resetAt } : {}),
      })
    }

    const tsCases = (lesson as unknown as { executableTestCases?: TsExecutableCaseRow[] }).executableTestCases ?? []
    const solCases = (lesson as unknown as { solidityTestCases?: SolidityCaseRow[] }).solidityTestCases ?? []
    void (lesson as unknown as { solidityFixtures?: SolidityFixtureRow[] }).solidityFixtures

    const hasExecutable = tsCases.length > 0 || solCases.length > 0

    const verdict = await CodingTaskService.#resolveVerdict({
      submittedCode,
      language,
      clientPassed,
      hasExecutable,
      tsCases,
      solCases,
      lesson,
    })

    const { submissionId, userLessonId } = await CodingTaskRepository.createSubmission(
      userId,
      lesson.id,
      submittedCode,
      language,
      verdict.passed,
      verdict.aiComment,
      ipAddress,
    )

    // Forward-only cost tracking; best-effort so it never blocks the verdict.
    if (verdict.usage && verdict.submissionType) {
      await recordAiUsage({
        userId,
        lessonId: lesson.id,
        userLessonId,
        submissionType: verdict.submissionType,
        submissionId,
        model: CODING_TASK_MODEL,
        isBatch: false,
        usage: verdict.usage,
      })
    }

    return { passed: verdict.passed }
  }

  static async #resolveVerdict(args: {
    submittedCode: string
    language: string
    clientPassed: boolean | null
    hasExecutable: boolean
    tsCases: TsExecutableCaseRow[]
    solCases: SolidityCaseRow[]
    lesson: Awaited<ReturnType<typeof LessonsService.getCodingTaskLesson>>
  }): Promise<VerdictResolution> {
    const { hasExecutable, tsCases, solCases, clientPassed, submittedCode, language, lesson } = args

    if (!hasExecutable) {
      return CodingTaskService.#legacyAiVerdict(submittedCode, language, lesson)
    }
    if (clientPassed !== true) {
      return CodingTaskService.#shortCircuitFail(clientPassed)
    }
    return CodingTaskService.#secondLayerVerdict(submittedCode, language, lesson, tsCases, solCases)
  }

  static async #legacyAiVerdict(
    submittedCode: string,
    language: string,
    lesson: Awaited<ReturnType<typeof LessonsService.getCodingTaskLesson>>,
  ): Promise<VerdictResolution> {
    const aiExpectedResult = lesson.aiExpectedResult ?? ''
    const result = await reviewCodingTask(submittedCode, language, aiExpectedResult, [])
    return {
      passed: result.passed,
      aiComment: packVerdictComment({ clientPassed: null, legacy: true, note: result.adminComment }),
      usage: result.usage,
      submissionType: 'coding_task',
    }
  }

  static #shortCircuitFail(clientPassed: boolean | null): VerdictResolution {
    return {
      passed: false,
      aiComment: packVerdictComment({
        clientPassed,
        note: clientPassed === null ? 'Client did not run tests' : 'Tests failed in browser',
      }),
    }
  }

  static async #secondLayerVerdict(
    submittedCode: string,
    language: string,
    lesson: Awaited<ReturnType<typeof LessonsService.getCodingTaskLesson>>,
    tsCases: TsExecutableCaseRow[],
    solCases: SolidityCaseRow[],
  ): Promise<VerdictResolution> {
    const cases =
      solCases.length > 0
        ? deserializeSolidityCases(solCases)
        : deserializeExecutableCases(tsCases)
    const signature = lesson.functionSignature ?? ''
    const result = await secondLayerReview(submittedCode, language, signature, cases)
    return {
      passed: result.approved,
      aiComment: packVerdictComment({
        clientPassed: true,
        aiApproved: result.approved,
        note: result.adminComment,
      }),
      usage: result.usage,
      submissionType: 'coding_task_recheck',
    }
  }

  static async getSubmissionsForUserLesson(userLessonId: number) {
    return CodingTaskRepository.listForUserLesson(userLessonId)
  }

  static async getSubmissionsForUserLessonAdmin(userLessonId: number) {
    return CodingTaskRepository.listForUserLessonAdmin(userLessonId)
  }
}
