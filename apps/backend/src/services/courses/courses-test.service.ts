import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { userLessons } from '../../db/schema'
import { AppError } from '../../lib/errors'
import { CoursesService } from './courses.service'

export class CoursesTestService {
  static async validateTestLesson(
    courseSlug: string,
    lessonSlug: string,
    userId: string,
    userAnswers: Record<string, string[]>,
  ) {
    const result = await CoursesService.getTestLessonWithQuestions(courseSlug, lessonSlug)
    if (!result) {
      throw new AppError(404, 'Lesson not found or not a test')
    }

    const [existing] = await db
      .select({ userAnswers: userLessons.userAnswers })
      .from(userLessons)
      .where(
        and(
          eq(userLessons.userId, userId),
          eq(userLessons.lessonId, result.lesson.id),
          eq(userLessons.isCompleted, true),
        ),
      )
      .limit(1)

    if (existing) {
      const correctAnswers: Record<string, string[]> = {}
      result.questions.forEach((q) => {
        correctAnswers[q.id] = q.options.filter((o) => o.isCorrect).map((o) => o.id)
      })
      return { correctAnswers }
    }

    const { lesson: foundLesson, questions } = result
    const correctAnswers: Record<string, string[]> = {}

    questions.forEach((q) => {
      const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id)
      correctAnswers[q.id] = correctOptionIds
    })

    await db.insert(userLessons).values({
      userId: userId,
      lessonId: foundLesson.id,
      userAnswers: userAnswers,
      isCompleted: true,
    })

    return { correctAnswers }
  }
}
