import { HTTPException } from 'hono/http-exception'
import type { Lesson } from '@redduck/payload-config'
import { MAX_REVIEW_FILE_BYTES } from '../github.service'
import type { FetchExpectedFilesResult } from '../types/github'

export function getLessonTasks(lesson: Lesson) {
  const tasks = lesson.reviewGradingTasks ?? []
  if (tasks.length === 0) {
    throw new HTTPException(400, { message: 'Review lesson has no grading tasks' })
  }
  return tasks
}

export function getLessonExpectedPaths(lesson: Lesson): string[] {
  const paths =
    lesson.reviewPaths
      ?.map((row) => (typeof row.path === 'string' ? row.path.trim() : ''))
      .filter((p) => p.length > 0) ?? []
  if (paths.length === 0) {
    throw new HTTPException(400, {
      message: 'This lesson has no review paths configured. Add at least one file path in the admin (Paths to review).',
    })
  }
  return paths
}

export function getLessonTemplateUrl(lesson: Lesson): string | null {
  const raw = lesson.templateRepoUrl
  return raw != null && String(raw).trim() !== '' ? String(raw).trim() : null
}

export function validateFetchResult(fetchResult: FetchExpectedFilesResult): void {
  if (fetchResult.oversizedPaths.length > 0) {
    const detail = fetchResult.oversizedPaths.map((o) => `${o.path} (${o.sizeBytes} bytes)`).join(', ')
    throw new HTTPException(400, {
      message: `These files exceed the maximum review size (${MAX_REVIEW_FILE_BYTES} bytes each): ${detail}`,
    })
  }
  if (fetchResult.files.length === 0) {
    throw new HTTPException(400, { message: 'No valid files were fetched' })
  }
}
