import type { ComponentType } from 'react'
import type { LessonType } from '@/types/lesson'
import { LessonTypeEnum } from '@/types/lesson'
import { CodeIcon } from '@/components/ui/icons/code'
import type { IconProps } from '@/components/ui/icons/types'
import { LectureLessonIcon } from '@/components/ui/icons/lecture-lesson'
import { TestLessonIcon } from '@/components/ui/icons/test-lesson'
import { BigProjectIcon } from '@/components/ui/icons/big-project'

export const lessonTypeToLabel: Record<LessonType, string> = {
  [LessonTypeEnum.LECTURE]: 'Lecture',
  [LessonTypeEnum.TEST]: 'Test',
  [LessonTypeEnum.CODING_TASK]: 'Coding Task',
  [LessonTypeEnum.REVIEW_TASK]: 'Review Task',
}

export const lessonTypeToIcon: Record<LessonType, ComponentType<IconProps>> = {
  [LessonTypeEnum.LECTURE]: LectureLessonIcon,
  [LessonTypeEnum.TEST]: TestLessonIcon,
  [LessonTypeEnum.CODING_TASK]: CodeIcon,
  [LessonTypeEnum.REVIEW_TASK]: BigProjectIcon,
}
