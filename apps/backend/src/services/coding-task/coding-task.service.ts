import { LessonsService } from '../lessons/lessons.service'
import { reviewCodingTask, secondLayerReview } from './coding-task.review'
import { CodingTaskRepository } from './coding-task.repository'
import { computeCodeHash } from './code-normalizer'
import { CodingTaskRateLimitService } from '../rate-limit/coding-task-rate-limit.service'
import { AppError } from '../../lib/errors'
import {
  deserializeExecutableCases,
  executableCasesHash,
  type ExecutableCaseRow,
} from './utils/executable-cases'
import { packVerdictComment } from './utils/verdict-comment'

interface VerdictResolution {
  passed: boolean
  aiComment: string
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

    const executableCases =
      (lesson as unknown as { executableTestCases?: ExecutableCaseRow[] }).executableTestCases ?? []
    const codeHash = computeCodeHash(submittedCode, language)
    const cacheKey = `${codeHash}:${executableCasesHash(executableCases, lesson.functionSignature)}`

    const verdict = await CodingTaskService.#resolveVerdict({
      cacheKey,
      lessonId: lesson.id,
      submittedCode,
      language,
      clientPassed,
      executableCases,
      lesson,
    })

    await CodingTaskRepository.createSubmission(
      userId,
      lesson.id,
      submittedCode,
      language,
      verdict.passed,
      verdict.aiComment,
      ipAddress,
    )

    return { passed: verdict.passed }
  }

  static async #resolveVerdict(args: {
    cacheKey: string
    lessonId: number
    submittedCode: string
    language: string
    clientPassed: boolean | null
    executableCases: ExecutableCaseRow[]
    lesson: Awaited<ReturnType<typeof LessonsService.getCodingTaskLesson>>
  }): Promise<VerdictResolution> {
    const { cacheKey, lessonId, executableCases, clientPassed, submittedCode, language, lesson } = args

    const cached = await CodingTaskRepository.getCachedReview(lessonId, cacheKey)
    if (cached !== null) {
      return { passed: cached.passed, aiComment: cached.aiComment ?? '' }
    }

    let verdict: VerdictResolution
    if (executableCases.length === 0) {
      verdict = await CodingTaskService.#legacyAiVerdict(submittedCode, language, lesson)
    } else if (clientPassed !== true) {
      verdict = CodingTaskService.#shortCircuitFail(clientPassed)
    } else {
      verdict = await CodingTaskService.#secondLayerVerdict(submittedCode, language, lesson, executableCases)
    }

    await CodingTaskRepository.setCachedReview(lessonId, cacheKey, verdict.passed, verdict.aiComment)
    return verdict
  }

  static async #legacyAiVerdict(
    submittedCode: string,
    language: string,
    lesson: Awaited<ReturnType<typeof LessonsService.getCodingTaskLesson>>,
  ): Promise<VerdictResolution> {
    const aiExpectedResult = lesson.aiExpectedResult ?? ''
    const visibleCases = (lesson.codingTestCases ?? []).map((tc) => ({
      title: tc.title ?? '',
      description: tc.description ?? null,
    }))
    const result = await reviewCodingTask(submittedCode, language, aiExpectedResult, visibleCases)
    return {
      passed: result.passed,
      aiComment: packVerdictComment({ clientPassed: null, legacy: true, note: result.adminComment }),
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
    executableCases: ExecutableCaseRow[],
  ): Promise<VerdictResolution> {
    const cases = deserializeExecutableCases(executableCases)
    const signature = lesson.functionSignature ?? ''
    const result = await secondLayerReview(submittedCode, language, signature, cases)
    return {
      passed: result.approved,
      aiComment: packVerdictComment({
        clientPassed: true,
        aiApproved: result.approved,
        note: result.adminComment,
      }),
    }
  }

  static async getSubmissionsForUserLesson(userLessonId: number) {
    return CodingTaskRepository.listForUserLesson(userLessonId)
  }

  static async getSubmissionsForUserLessonAdmin(userLessonId: number) {
    return CodingTaskRepository.listForUserLessonAdmin(userLessonId)
  }
}
