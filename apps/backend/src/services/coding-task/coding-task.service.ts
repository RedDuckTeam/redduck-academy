import { LessonsService } from '../lessons/lessons.service'
import { reviewCodingTask } from './coding-task.review'
import { CodingTaskRepository } from './coding-task.repository'
import { computeCodeHash } from './code-normalizer'
import { SubmissionRateLimitService } from '../rate-limit/submission-rate-limit.service'
import { AppError } from '../../lib/errors'

export class CodingTaskService {
  static async submitCode(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    submittedCode: string,
    language: string,
    ipAddress: string,
  ): Promise<{ passed: boolean; attemptsRemaining: number }> {
    const lesson = await LessonsService.getCodingTaskLesson(courseSlug, lessonSlug)

    const rateLimit = await SubmissionRateLimitService.checkAndConsume(userId, ipAddress, lesson.id)
    if (!rateLimit.allowed) {
      throw new AppError(429, 'Rate limit exceeded', { retryAfterMs: rateLimit.retryAfterMs })
    }

    const codeHash = computeCodeHash(submittedCode, language)
    const cached = await CodingTaskRepository.getCachedReview(lesson.id, codeHash)

    let passed: boolean
    if (cached !== null) {
      passed = cached
    } else {
      const aiExpectedResult = lesson.aiExpectedResult ?? ''
      const testCases = (lesson.codingTestCases ?? []).map((tc) => ({
        title: tc.title ?? '',
        description: tc.description ?? null,
      }))

      const result = await reviewCodingTask(submittedCode, language, aiExpectedResult, testCases)
      passed = result.passed
      await CodingTaskRepository.setCachedReview(lesson.id, codeHash, passed)
    }

    await CodingTaskRepository.createSubmission(userId, lesson.id, submittedCode, language, passed)

    return { passed, attemptsRemaining: rateLimit.attemptsRemaining }
  }

  static async getSubmissionsForUserLesson(userLessonId: number) {
    return CodingTaskRepository.listForUserLesson(userLessonId)
  }
}
