import { useState } from 'react'
import { toast } from 'sonner'
import { InProgressDialog } from './inprogress-dialog'
import { SubmissionReviewTabs } from './submission-review-tabs'
import type { Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TerminalIcon } from '@/components/ui/icons/terminal'
import { ClipboardIcon } from '@/components/ui/icons/clipboard'
import { useSubmitProject } from '@/hooks/api/lessons/useSubmitProject'
import { useLessonForUser } from '@/hooks/api/lessons/useLessonForUser'
import { Dialog } from '@/components/ui/dialog'

interface ProjectSubmissionProps {
  lesson: Lesson
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
}

export function ProjectSubmission({ lesson, courseSlug, lessonSlug, moduleSlug }: ProjectSubmissionProps) {
  const [link, setLink] = useState('')
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)
  const { mutateAsync: submitProject, isPending } = useSubmitProject(courseSlug, lessonSlug)
  const submissions = userLesson?.submissions ?? []
  const latest = submissions.at(-1)

  const handleSubmit = async () => {
    try {
      await submitProject({ courseSlug, lessonSlug, repoUrl: link })
    } catch {
      toast.error('Failed to submit project')
    }
  }

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      setLink(text)
    })
  }

  return (
    <>
      <Dialog open={latest?.status === 'pending'}>
        <InProgressDialog courseSlug={courseSlug} lessonSlug={lessonSlug} moduleSlug={moduleSlug} lesson={lesson} />
      </Dialog>
      <div className="flex flex-col w-fit gap-5">
        {lesson.templateRepoUrl && (
          <Text variant="main-18" className="flex gap-2">
            Starter repository:{' '}
            <a href={lesson.templateRepoUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
              {lesson.templateRepoUrl}
            </a>
          </Text>
        )}
        <Text variant="caps-24" className="font-medium">
          YOUR WORK
        </Text>

        <Text variant="caps-20">{userLesson?.attemptsLeft} attempts left</Text>

        <div className="flex items-center gap-2">
          <TerminalIcon className="" />
          <Text variant="main-18">Paste link to repository</Text>
        </div>
        <div className="relative">
          <Input
            type="url"
            placeholder="https://"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="min-w-[420px]"
          />
          <button
            onClick={handlePaste}
            type="button"
            className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2"
          >
            <ClipboardIcon />
          </button>
        </div>
        <Button disabled={!link || isPending || !userLesson?.attemptsLeft} onClick={handleSubmit} className="w-full">
          <Text variant="caps-20">SEND TO REVIEW</Text>
        </Button>

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
