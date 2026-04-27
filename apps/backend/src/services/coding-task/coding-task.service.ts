import { LessonsService } from '../lessons/lessons.service'
import { reviewCodingTask } from './coding-task.review'
import { CodingTaskRepository } from './coding-task.repository'
import { computeCodeHash } from './code-normalizer'
import { CodingTaskRateLimitService } from '../rate-limit/coding-task-rate-limit.service'
import { AppError } from '../../lib/errors'

export class CodingTaskService {
  static async submitCode(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    submittedCode: string,
    language: string,
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

    const codeHash = computeCodeHash(submittedCode, language)
    const cached = await CodingTaskRepository.getCachedReview(lesson.id, codeHash)

    let passed: boolean
    let aiComment: string | null
    if (cached !== null) {
      passed = cached.passed
      aiComment = cached.aiComment
    } else {
      const aiExpectedResult = lesson.aiExpectedResult ?? ''
      const testCases = (lesson.codingTestCases ?? []).map((tc) => ({
        title: tc.title ?? '',
        description: tc.description ?? null,
      }))

      const result = await reviewCodingTask(submittedCode, language, aiExpectedResult, testCases)
      passed = result.passed
      aiComment = result.adminComment
      await CodingTaskRepository.setCachedReview(lesson.id, codeHash, passed, aiComment)
    }

    await CodingTaskRepository.createSubmission(userId, lesson.id, submittedCode, language, passed, aiComment, ipAddress)

    return { passed }
  }

  static async getSubmissionsForUserLesson(userLessonId: number) {
    return CodingTaskRepository.listForUserLesson(userLessonId)
  }

  static async getSubmissionsForUserLessonAdmin(userLessonId: number) {
    return CodingTaskRepository.listForUserLessonAdmin(userLessonId)
  }
}
