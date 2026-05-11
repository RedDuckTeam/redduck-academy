import type {
  LearnerCodingTaskSubmission,
  LearnerProjectSubmission,
  LearnerReviewFeedback,
  ReviewCriterionFeedback as ContractsReviewCriterionFeedback,
  UserSettings as ContractsUserSettings,
} from '@redduck/api-contracts'
import type { Certificate } from '@/lib/api/certificates'

export type CodingLanguage = 'solidity' | 'rust' | 'typescript'

export interface PublicUserProfile {
  username: string
  isPrivate: false
  name: string
  bio: string | null
  image: string | null
  rank: number
  completedLessonsCount: number
  certificates: Certificate[]
}

export interface PrivateUserProfile {
  username: string
  isPrivate: true
}

export type UserPublicProfile = PublicUserProfile | PrivateUserProfile

export interface CoursePrerequisite {
  id: number
  slug: string
  title: string
}

export interface Course {
  id: number
  title: string
  slug: string
  description: string
  updatedAt: string
  createdAt: string
  modules: Module[]
  prerequisiteCourse?: CoursePrerequisite | null
}

export type UserSettings = ContractsUserSettings

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

/**
 * TS coding-task wire shape (Payload `executableTestCases` array).
 * `inputJson` / `expectedJson` are JSON-encoded strings.
 */
export interface ExecutableTestCase {
  id: string
  inputJson: string
  expectedJson: string
}

/** Per-row argument value in a Solidity test case. Stored as a canonical string. */
export interface SolidityArgValue {
  id?: string | null
  value: string
}

/** One step inside a 'sequence' Solidity test case, mirroring the Payload step row. */
export interface SoliditySequenceStep {
  id?: string | null
  functionName: string
  args?: SolidityArgValue[] | null
  valueWei?: string | null
  caller?: string | null
}

/** Solidity test-case wire shape (Payload `solidityTestCases` blocks). Discriminated by `blockType`. */
export type SolidityTestCase =
  | {
      id: string
      blockType: 'returnAssertion'
      functionName: string
      args?: SolidityArgValue[] | null
      valueWei?: string | null
      caller?: string | null
      expected: string
    }
  | {
      id: string
      blockType: 'postCheckAssertion'
      functionName: string
      args?: SolidityArgValue[] | null
      valueWei?: string | null
      caller?: string | null
      postCheckFunctionName: string
      postCheckArgs?: SolidityArgValue[] | null
      postCheckCaller?: string | null
      expected: string
    }
  | {
      id: string
      blockType: 'sequence'
      steps?: SoliditySequenceStep[] | null
      assertion: 'lastReturn' | 'postCheck'
      postCheckFunctionName?: string | null
      postCheckArgs?: SolidityArgValue[] | null
      postCheckCaller?: string | null
      expected: string
    }

export type CodingTaskSubmission = LearnerCodingTaskSubmission

/** Public shape for review_task grading rows (from GET lesson); criteria omitted when criteriaHidden is true. */
export interface PublicReviewGradingTask {
  id: string
  title: string
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
  next: string | null
  /** Review-task rubric rows (learner-safe; hidden rows have criteriaHidden and no criteria). */
  reviewGradingTasks?: PublicReviewGradingTask[]
  /** Coding-task fields */
  codingLanguage?: CodingLanguage
  starterCode?: string | null
  functionSignature?: string | null
  solidityContractName?: string | null
  solidityConstructorArgs?: SolidityArgValue[] | null
  executableTestCases?: ExecutableTestCase[]
  solidityTestCases?: SolidityTestCase[]
}

export type ReviewCriterionFeedback = ContractsReviewCriterionFeedback
export type ReviewFeedback = LearnerReviewFeedback
export type LatestProjectSubmission = LearnerProjectSubmission

export interface LessonForUser extends Lesson {
  userAnswers: Record<string, string[]> | null
  isCompleted: boolean
  correctAnswers: Record<string, string[]> | null
  /** Set when rate-limited; ms until retry is allowed. */
  retryAfterMs?: number
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
  question: Record<string, any> | null
  order: number
  parentId: number
  isMultipleChoices: boolean
  id: string
  options?: TestQuestionOption[]
}

export interface TestQuestionOption {
  label: Record<string, any> | null
  order: number
  parentId: string
  id: string
}
