import { createFileRoute, Link } from '@tanstack/react-router'
import { useAdminUserLessonDetail } from '@/hooks/api/admin/useAdminUserLessonDetail'
import { LessonTestQuestion } from '@/components/pages/lesson/test/lesson-test-question'
import { SubmissionReviewTabs } from '@/components/pages/lesson/project/submission-review-tabs'
import { Text } from '@/components/ui/text'
import type {
  AdminCodingTaskSubmission as CodingTaskSubmission,
  AdminProjectSubmission as LatestProjectSubmission,
} from '@redduck/api-contracts'

export const Route = createFileRoute('/admin/users/$userId/$courseSlug/$lessonSlug')({
  validateSearch: (search: Record<string, unknown>): { email: string; submissionId?: number } => {
    // Which submission to open by default (from the lesson submissions list); falls back to latest.
    // Kept optional so other links into this route needn't supply it.
    const raw = search.submissionId
    const submissionId =
      typeof raw === 'number' ? raw : typeof raw === 'string' && raw !== '' ? Number(raw) : undefined
    return {
      email: typeof search.email === 'string' ? search.email : '',
      ...(submissionId != null && !Number.isNaN(submissionId) ? { submissionId } : {}),
    }
  },
  ssr: false,
  component: AdminUserLessonPage,
})

function AdminUserLessonPage() {
  const { userId, courseSlug, lessonSlug } = Route.useParams()
  const { email, submissionId } = Route.useSearch()
  const { data: lesson, isPending, isError } = useAdminUserLessonDetail(userId, courseSlug, lessonSlug)

  return (
    <main className="mx-5 min-h-screen py-10 lg:mx-[60px] flex flex-col gap-8 max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-secondary flex-wrap">
        <Link to="/admin" search={{ tab: 'users' }} className="hover:text-black">
          Admin
        </Link>
        <span>/</span>
        <Link
          to="/admin/users/$userId"
          params={{ userId }}
          search={{ tab: 'users', email: email || '' }}
          className="hover:text-black"
        >
          {email || userId}
        </Link>
        <span>/</span>
        <span className="text-black">{lessonSlug}</span>
      </nav>

      {isPending && (
        <Text variant="main-16" className="text-secondary">
          Loading...
        </Text>
      )}
      {isError && (
        <Text variant="main-16" className="text-primary">
          Failed to load lesson.
        </Text>
      )}

      {lesson && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Text variant="subtitle-32" element="h1">
              {lesson.title}
            </Text>
            <div className="flex items-center gap-3">
              <Text variant="main-14" className="text-secondary capitalize">
                {lesson.type.replace('_', ' ')}
              </Text>
              <span className="text-secondary">·</span>
              <Text variant="main-14" className={lesson.isCompleted ? 'text-success' : 'text-secondary'}>
                {lesson.isCompleted ? 'Completed' : 'Not completed'}
              </Text>
            </div>
          </div>

          {lesson.type === 'test' && <TestView lesson={lesson} />}
          {lesson.type === 'review_task' && <ReviewView lesson={lesson} initialSubmissionId={submissionId} />}
          {lesson.type === 'coding_task' && <CodingView lesson={lesson} />}
          {lesson.type === 'lecture' && <LectureView lesson={lesson} />}
        </div>
      )}
    </main>
  )
}

function TestView({ lesson }: { lesson: NonNullable<ReturnType<typeof useAdminUserLessonDetail>['data']> }) {
  if (!lesson.questions?.length) {
    return (
      <Text variant="main-16" className="text-secondary">
        No questions found.
      </Text>
    )
  }

  const userAnswers = lesson.userAnswers ?? {}
  const correctAnswers = lesson.correctAnswers ?? {}

  return (
    <div className="flex flex-col gap-10">
      {!lesson.isCompleted && (
        <Text variant="main-16" className="text-secondary">
          User has not submitted this test yet.
        </Text>
      )}
      {lesson.questions.map((q) => (
        <LessonTestQuestion
          key={q.id}
          question={q}
          rightAnswerIds={correctAnswers[q.id] ?? []}
          selectedIds={userAnswers[q.id] ?? []}
          onSelect={() => {}}
          isCompleted={lesson.isCompleted}
          showUnansweredWarning={false}
        />
      ))}
    </div>
  )
}

function ReviewView({
  lesson,
  initialSubmissionId,
}: {
  lesson: NonNullable<ReturnType<typeof useAdminUserLessonDetail>['data']>
  initialSubmissionId?: number
}) {
  const submissions = (lesson.submissions ?? []) as LatestProjectSubmission[]
  if (!submissions.length) {
    return (
      <Text variant="main-16" className="text-secondary">
        No submissions yet.
      </Text>
    )
  }
  const pending = submissions.filter((s) => s.status === 'pending')
  return (
    <div className="flex flex-col gap-4">
      {pending.length > 0 && (
        <Text variant="main-14" className="text-secondary">
          {pending.length} submission{pending.length > 1 ? 's' : ''} pending review.
        </Text>
      )}
      <SubmissionReviewTabs submissions={submissions} showRepository initialSubmissionId={initialSubmissionId} />
    </div>
  )
}

function CodingView({ lesson }: { lesson: NonNullable<ReturnType<typeof useAdminUserLessonDetail>['data']> }) {
  const submissions = (lesson.submissions ?? []) as CodingTaskSubmission[]
  if (!submissions.length) {
    return (
      <Text variant="main-16" className="text-secondary">
        No submissions yet.
      </Text>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      {submissions.map((s, i) => (
        <div key={s.id} className="flex flex-col gap-3 border border-border p-5">
          <div className="flex items-center gap-3">
            <Text variant="caps-14" className={s.passed ? 'text-success' : 'text-primary'}>
              {s.passed ? 'PASSED' : 'FAILED'}
            </Text>
            <Text variant="main-14" className="text-secondary">
              Attempt {i + 1} · {new Date(s.submittedAt).toLocaleString()}
            </Text>
          </div>
          {s.aiComment && (
            <div className="flex flex-col gap-1 border-l-2 border-secondary pl-3">
              <Text variant="caps-14" className="text-secondary">
                AI Review
              </Text>
              <Text variant="main-14" className="text-black whitespace-pre-wrap">
                {s.aiComment}
              </Text>
            </div>
          )}
          <pre className="overflow-auto bg-muted p-4 text-sm rounded-sm font-mono whitespace-pre-wrap break-all">
            {s.submittedCode}
          </pre>
        </div>
      ))}
    </div>
  )
}

function LectureView({ lesson }: { lesson: NonNullable<ReturnType<typeof useAdminUserLessonDetail>['data']> }) {
  return (
    <Text variant="main-16" className="text-secondary">
      {lesson.isCompleted ? 'User has completed this lecture.' : 'User has not completed this lecture yet.'}
    </Text>
  )
}
