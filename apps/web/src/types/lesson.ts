export interface Course {
  id: number
  title: string
  slug: string
  description: string
  updatedAt: string
  createdAt: string
  modules: Module[]
}

export interface Module {
  id: number
  title: string
  slug: string
  courseId: number
  order: number
  updatedAt: string
  createdAt: string
  lessons: Lesson[]
}

export interface Lesson {
  id: number
  title: string
  slug: string
  moduleId: number
  order: number
  type: LessonType
  content?: any
  updatedAt: string
  createdAt: string
  questions?: TestQuestion[]
  maxPoints: number
  next: string | null
}

export interface LessonForUser extends Lesson {
  earnedPoints: number | null
  userAnswers: Record<string, string[]> | null
  isCompleted: boolean
  correctAnswers: Record<string, string[]> | null
}

export enum LessonTypeEnum {
  LECTURE = 'lecture',
  TEST = 'test',
  CODING_TASK = 'coding_task',
  REVIEW_TASK = 'review_task',
}

export type LessonType = (typeof LessonTypeEnum)[keyof typeof LessonTypeEnum]

export enum CourseStatusEnum {
  START = 'start',
  CONTINUE = 'continue',
  COMPLETED = 'completed',
}

export type CourseStatus = (typeof CourseStatusEnum)[keyof typeof CourseStatusEnum]

export interface TestQuestion {
  question: string
  order: number
  parentId: number
  points: number | null
  isMultipleChoices: boolean
  id: string
  options?: TestQuestionOption[]
}

export interface TestQuestionOption {
  label: string
  order: number
  parentId: string
  id: string
}
