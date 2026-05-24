import { AppError, GENERIC_ERROR_MESSAGE } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { LessonsService } from '../lessons/lessons.service'
import { githubService, parseGitHubRepoUrl } from './github.service'
import { buildReviewPrompt } from './prompt.builder'
import { createBatch, pollAndParse } from './batch.service'
import { SubmissionRepository } from './submission.repository'
import {
  getLessonExpectedPaths,
  getLessonTasks,
  getLessonTemplateUrl,
  validateFetchResult,
} from './utils/review-lesson'
import { SubmissionRateLimitService } from '../rate-limit/submission-rate-limit.service'
import { recordAiUsage } from '../ai/usage.service'

const logger = new Logger('ReviewService')

// ─── Service ─────────────────────────────────────────────────────────────────

export class ReviewService {
  static async submitProject(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    repoUrl: string,
    ipAddress: string,
  ): Promise<void> {
    const lesson = await LessonsService.getReviewLessonWithRubric(courseSlug, lessonSlug)

    // Cheap, read-only rate-limit peek so we reject obviously throttled callers
    // before any GitHub or DB work. The atomic consume happens after the dup-check
    // so re-submissions of the same commit don't burn an attempt.
    const peek = await SubmissionRateLimitService.check(userId, ipAddress, lesson.id)
    if (!peek.allowed) {
      throw new AppError(429, 'Rate limit exceeded', { retryAfterMs: peek.retryAfterMs })
    }

    const tasks = getLessonTasks(lesson)
    const expectedPaths = getLessonExpectedPaths(lesson)
    const templateUrl = getLessonTemplateUrl(lesson)

    if (templateUrl) {
      await githubService.assertRepoIsForkOfTemplate(repoUrl, templateUrl)
    }

    // Reject re-submissions of the same commit before doing any expensive work
    // (file fetch, rate-limit consumption, OpenAI batch). Reuse the resolved SHA for
    // the file fetch so the branch can't drift to a newer tip between the two calls.
    const { owner, repo, refFromUrl } = parseGitHubRepoUrl(repoUrl)
    const { commitSha: resolvedSha, resolvedRef } = await githubService.resolveRepoRef(owner, repo, refFromUrl)
    const existingUserLesson = await SubmissionRepository.getUserLesson(userId, lesson.id)
    if (existingUserLesson) {
      const duplicate = await SubmissionRepository.findCompletedByCommit(existingUserLesson.id, resolvedSha)
      if (duplicate) {
        throw new AppError(409, 'This commit was already reviewed. Push a new commit and submit again.')
      }
    }

    const rateLimit = await SubmissionRateLimitService.checkAndConsume(userId, ipAddress, lesson.id)
    if (!rateLimit.allowed) {
      throw new AppError(429, 'Rate limit exceeded', { retryAfterMs: rateLimit.retryAfterMs })
    }

    const fetchResult = await githubService.fetchExpectedFilesAtCommit(
      owner,
      repo,
      resolvedSha,
      resolvedRef,
      expectedPaths,
    )
    validateFetchResult(fetchResult)

    const submissionId = await SubmissionRepository.createForReview(userId, lesson.id, repoUrl)

    const prompt = buildReviewPrompt(fetchResult, tasks)
    try {
      const batchId = await createBatch(prompt, submissionId, tasks.length)
      await SubmissionRepository.updateBatch(submissionId, batchId, fetchResult.commitSha)
    } catch (err) {
      logger.error('Failed to create OpenAI batch', err, { submissionId, lessonId: lesson.id })
      // Mark the submission failed so the user isn't stuck in a pending state with no batch.
      // Store the safe message — the raw error would otherwise surface in the learner's submission history.
      await SubmissionRepository.markFailed(submissionId, GENERIC_ERROR_MESSAGE)
      throw new AppError(502, GENERIC_ERROR_MESSAGE)
    }
  }

  static async syncProjectReview(userId: string, courseSlug: string, lessonSlug: string): Promise<void> {
    const lesson = await LessonsService.getReviewLessonWithRubric(courseSlug, lessonSlug)

    const userLesson = await SubmissionRepository.getUserLesson(userId, lesson.id)
    if (!userLesson) {
      throw new AppError(404, 'Lesson not started')
    }

    const submissions = await SubmissionRepository.listForUserLessonAdmin(userLesson.id)
    const latest = submissions.at(-1)
    if (!latest || latest.status !== 'pending' || !latest.batchRequestId) return

    const result = await pollAndParse(latest.batchRequestId, latest.id, lesson.reviewGradingTasks ?? [])

    if (result.type === 'failed') {
      // The underlying detail is already written to the logs inside pollAndParse.
      // Learners only ever see the generic message in the submission history.
      await SubmissionRepository.markFailed(latest.id, GENERIC_ERROR_MESSAGE)
      return
    }
    if (result.type === 'pending') return

    const { feedback } = result
    await SubmissionRepository.complete(latest.id, userLesson.id, feedback, feedback.lessonPassed)

    // Forward-only cost tracking; best-effort. Batch API → isBatch true (billed at 50%).
    await recordAiUsage({
      userId,
      lessonId: lesson.id,
      userLessonId: userLesson.id,
      submissionType: 'project',
      submissionId: latest.id,
      model: result.model,
      isBatch: true,
      usage: result.usage,
      batchRequestId: latest.batchRequestId,
    })
  }

  static async getSubmissionsForUserLesson(userLessonId: number) {
    return SubmissionRepository.listForUserLesson(userLessonId)
  }

  static async getSubmissionsForUserLessonAdmin(userLessonId: number) {
    return SubmissionRepository.listForUserLessonAdmin(userLessonId)
  }
}
