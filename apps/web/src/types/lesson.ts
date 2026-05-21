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

/** One step inside a Solidity test case, mirroring the Payload step row. */
export interface SolidityCaseStep {
  id?: string | null
  /** Which contract this step targets. Defaults to '@self' (the student's contract). */
  target?: string | null
  functionName: string
  args?: SolidityArgValue[] | null
  valueWei?: string | null
  caller?: string | null
  /** When true, this step is hidden from the learner in the test-case view (still executes). */
  hideFromLearner?: boolean | null
  /** Optional. When set, the runner decodes this step's return and compares against it. */
  expected?: string | null
}

/** Solidity test-case wire shape (Payload `solidityTestCases` array row). */
export interface SolidityTestCase {
  id: string
  steps?: SolidityCaseStep[] | null
}

/**
 * Peer contract deployed alongside the student's contract for the duration of a test
 * case. Hidden from the student. Referenced by tests via `@<alias>`.
 */
export interface SolidityFixture {
  id?: string | null
  alias: string
  source: string
  contractName?: string | null
  constructorArgs?: SolidityArgValue[] | null
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
  solidityFixtures?: SolidityFixture[] | null
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
