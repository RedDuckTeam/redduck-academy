import { LessonsService } from '../lessons/lessons.service'
import { reviewCodingTask } from './coding-task.review'
import { CodingTaskRepository } from './coding-task.repository'
import { computeCodeHash } from './code-normalizer'

export class CodingTaskService {
  static async submitCode(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    submittedCode: string,
    language: string,
  ): Promise<{ passed: boolean; attemptsLeft: number }> {
    const lesson = await LessonsService.getCodingTaskLesson(courseSlug, lessonSlug)

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

    const { attemptsLeft } = await CodingTaskRepository.createSubmission(
      userId,
      lesson.id,
      submittedCode,
      language,
      passed,
      lesson.maxPoints ?? 0,
    )

    return { passed, attemptsLeft }
  }

  static async getSubmissionsForUserLesson(userLessonId: number) {
    return CodingTaskRepository.listForUserLesson(userLessonId)
  }
}
