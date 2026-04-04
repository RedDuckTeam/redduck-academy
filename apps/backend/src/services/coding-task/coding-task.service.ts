import { LessonsService } from '../lessons/lessons.service'
import { reviewCodingTask } from './coding-task.review'
import { CodingTaskRepository } from './coding-task.repository'

export class CodingTaskService {
  static async submitCode(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    submittedCode: string,
    language: string,
  ): Promise<{ passed: boolean; attemptsLeft: number }> {
    const lesson = await LessonsService.getCodingTaskLesson(courseSlug, lessonSlug)

    const aiExpectedResult = lesson.aiExpectedResult ?? ''
    const testCases = (lesson.codingTestCases ?? []).map((tc) => ({
      title: tc.title ?? '',
      description: tc.description ?? null,
    }))

    const { passed } = await reviewCodingTask(submittedCode, language, aiExpectedResult, testCases)

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
