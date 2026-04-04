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

export interface CodingTestCase {
  id: string
  title: string
  description?: string
}

export interface CodingTaskSubmission {
  id: number
  passed: boolean
  submittedAt: string
}

/** Public shape for review_task grading rows (from GET lesson); criteria omitted when criteriaHidden is true. */
export interface PublicReviewGradingTask {
  id: string
  title: string
  points: number
  isRequired: boolean
  _order: number
  criteriaHidden: boolean
  criteria?: string
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
  templateRepoUrl?: string
  maxPoints: number
  next: string | null
  /** Review-task rubric rows (learner-safe; hidden rows have criteriaHidden and no criteria). */
  reviewGradingTasks?: PublicReviewGradingTask[]
  /** Coding-task fields */
  codingLanguage?: 'solidity' | 'rust' | 'typescript'
  starterCode?: string | null
  codingTestCases?: CodingTestCase[]
}

export interface ReviewCriterionFeedback {
  taskId: string
  name: string
  points: number
  maxPoints: number
  passed: boolean
  comment: string
}

export interface ReviewFeedback {
  summary: string
  criteria: ReviewCriterionFeedback[]
}

export interface LatestProjectSubmission {
  id: number
  status: string
  submittedAt: string
  batchRequestId: string | null
  feedback: ReviewFeedback | null
  errorMessage: string | null
}

export interface LessonForUser extends Lesson {
  earnedPoints: number | null
  userAnswers: Record<string, string[]> | null
  isCompleted: boolean
  correctAnswers: Record<string, string[]> | null
  attemptsLeft?: number
  /** Review-task submissions, oldest first; latest is `.at(-1)`. */
  submissions?: LatestProjectSubmission[] | CodingTaskSubmission[]
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
