import type { Lesson } from '@redduck/payload-config'
import { AppError } from '../../../lib/errors'
import type { FetchExpectedFilesResult } from '../types/github'

export function getLessonTasks(lesson: Lesson) {
  const tasks = lesson.reviewGradingTasks ?? []
  if (tasks.length === 0) {
    throw new AppError(400, 'Review lesson has no grading tasks')
  }
  return tasks
}

export function getLessonExpectedPaths(lesson: Lesson): string[] {
  const paths =
    lesson.reviewPaths
      ?.map((row) => (typeof row.path === 'string' ? row.path.trim() : ''))
      .filter((p) => p.length > 0) ?? []
  if (paths.length === 0) {
    throw new AppError(400, 'This lesson has no review paths configured. Add at least one file path in the admin (Paths to review).')
  }
  return paths
}

export function validateFetchResult(fetchResult: FetchExpectedFilesResult): void {
  if (fetchResult.oversizedPaths.length > 0) {
    const detail = fetchResult.oversizedPaths.map((o) => o.path).join(', ')
    throw new AppError(413, `Some files are too large to review. Please reduce their size and try again: ${detail}`)
  }
  if (fetchResult.files.length === 0) {
    throw new AppError(400, 'No valid files were fetched')
  }
}
