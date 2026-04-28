import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { InProgressDialog } from './inprogress-dialog'
import { HowToSubmitDialog } from './how-to-submit-dialog'
import { SubmissionReviewTabs } from './submission-review-tabs'
import type { Lesson, LatestProjectSubmission } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TerminalIcon } from '@/components/ui/icons/terminal'
import { ClipboardIcon } from '@/components/ui/icons/clipboard'
import { useSubmitProject } from '@/hooks/api/lessons/useSubmitProject'
import { useLessonForUser } from '@/hooks/api/lessons/useLessonForUser'
import { Dialog } from '@/components/ui/dialog'
import { useSession } from '@/hooks/useSession'
import { RateLimitError } from '@/lib/api/rate-limit'

interface ProjectSubmissionProps {
  lesson: Lesson
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
}

export function ProjectSubmission({ lesson, courseSlug, lessonSlug, moduleSlug }: ProjectSubmissionProps) {
  const router = useRouter()
  const { session } = useSession()
  const [link, setLink] = useState('')
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)
  const { mutate: submitProject, isPending, error: submitError } = useSubmitProject(courseSlug, lessonSlug)
  const submissions = (userLesson?.submissions ?? []) as LatestProjectSubmission[]
  const latest = submissions.at(-1)
  const rateLimitError = submitError instanceof RateLimitError ? submitError : null
  const isGithubLink = /^https?:\/\/github\.com\/[^/]+\/[^/]+/i.test(link.trim())

  const handleSubmit = () => {
    submitProject({ courseSlug, lessonSlug, repoUrl: link })
  }

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    setLink(text)
  }

  return (
    <>
      <Dialog open={latest?.status === 'pending'}>
        <InProgressDialog courseSlug={courseSlug} lessonSlug={lessonSlug} moduleSlug={moduleSlug} lesson={lesson} />
      </Dialog>
      <div className="flex min-w-0 w-full max-w-full flex-col gap-5">
        {lesson.templateRepoUrl && (
          <div className="flex flex-col gap-2">
            <Text variant="main-18" className="min-w-0 max-w-full wrap-anywhere">
              Starter repository:{' '}
              <a
                href={lesson.templateRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary wrap-anywhere"
              >
                {lesson.templateRepoUrl}
              </a>
            </Text>
            <HowToSubmitDialog />
          </div>
        )}
        <Text variant="caps-24" element="h2" id="submit" className="font-medium scroll-mt-20">
          YOUR WORK
        </Text>

        <div className="flex items-center gap-2">
          <TerminalIcon className="" />
          <Text variant="main-18">Paste link to repository</Text>
        </div>
        <div className="relative">
          <Input
            type="url"
            placeholder="https://github.com/"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="max-sm:w-full sm:min-w-[420px] pr-10"
          />
          <button
            onClick={handlePaste}
            type="button"
            className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2"
          >
            <ClipboardIcon />
          </button>
        </div>
        {!session ? (
          <Button onClick={() => router.navigate({ to: '/sign-up' })} className="w-full">
            <Text variant="caps-20">Sign in</Text>
          </Button>
        ) : (
          <Button disabled={!isGithubLink || isPending || !!rateLimitError} onClick={handleSubmit} className="w-full">
            <Text variant="caps-20">SEND TO REVIEW</Text>
          </Button>
        )}

        {submissions.length > 0 && (
          <div className="flex flex-col gap-3 mt-2 ">
            <Text variant="caps-24" className="font-medium">
              REVIEW STATUS
            </Text>
            <SubmissionReviewTabs submissions={submissions} />
          </div>
        )}
      </div>
    </>
  )
}
