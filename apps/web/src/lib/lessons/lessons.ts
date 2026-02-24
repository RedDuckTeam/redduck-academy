import type { LessonType } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'

export const lessonTypeToLabel: Record<LessonType, string> = {
  [LessonTypeEnum.LECTURE]: 'Lecture',
  [LessonTypeEnum.TEST]: 'Test',
  [LessonTypeEnum.CODING_TASK]: 'Coding Task',
  [LessonTypeEnum.REVIEW_TASK]: 'Review Task',
}
