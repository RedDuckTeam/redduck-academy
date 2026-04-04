import { eq, and, sql } from 'drizzle-orm'
import { db } from '../../db'
import { user } from '../../db/auth-schema'
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
      .select({ score: userLessons.score, userAnswers: userLessons.userAnswers })
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
      return {
        score: existing.score ?? 0,
        correctAnswers,
      }
    }

    const { lesson: foundLesson, questions } = result

    let totalScore = 0
    const correctAnswers: Record<string, string[]> = {}

    questions.forEach((q) => {
      const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id)
      correctAnswers[q.id] = correctOptionIds

      const submission = userAnswers[q.id] || []

      const isCorrect =
        correctOptionIds.length === submission.length && correctOptionIds.every((id) => submission.includes(id))

      if (isCorrect) {
        totalScore += q.points ?? 5
      }
    })

    await db.transaction(async (tx) => {
      if (totalScore > 0) {
        await tx
          .update(user)
          .set({
            points: sql`${user.points} + ${totalScore}`,
          })
          .where(eq(user.id, userId))
      }

      await tx.insert(userLessons).values({
        userId: userId,
        lessonId: foundLesson.id,
        score: totalScore,
        userAnswers: userAnswers,
        isCompleted: true,
      })
    })

    return {
      score: totalScore,
      correctAnswers,
    }
  }
}
