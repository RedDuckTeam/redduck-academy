import { useCallback, useEffect, useRef, useState } from 'react'
import { getRouteApi, useLocation, useRouter } from '@tanstack/react-router'
import { NavTile } from './nav-tile'
import { SignInPromptModal } from '../sign-in-prompt-modal'
import type { Lesson } from '@/types/lesson'
import { useCourse } from '@/hooks/api/courses/useCourse'
import { useSession } from '@/hooks/useSession'
import { useMarkLessonCompleted } from '@/hooks/api/lessons/useMarkLessonCompleted'
import { useCourseAccess } from '@/hooks/api/user/useUserCourseAccess'
import { usePostHog } from '@posthog/react'

interface LessonNavigationProps {
  courseSlug: string
  lesson: Lesson
}

interface NavTarget {
  moduleSlug: string
  lessonSlug: string
  title: string
}

const lessonRoute = getRouteApi('/courses/$courseSlug/$moduleSlug/$lessonSlug')

export const LessonNavigation = ({ courseSlug, lesson }: LessonNavigationProps) => {
  const { session } = useSession()
  const { data: course } = useCourse(courseSlug)
  const { mutate: markCompleted } = useMarkLessonCompleted()
  const courseAccess = useCourseAccess()
  const posthog = usePostHog()
  const router = useRouter()
  const location = useLocation()
  const { pendingNext } = lessonRoute.useSearch()
  const [promptOpen, setPromptOpen] = useState(false)

  const flat: NavTarget[] =
    course?.data.modules.flatMap((m) =>
      m.lessons.map((l) => ({ moduleSlug: m.slug, lessonSlug: l.slug, title: l.title })),
    ) ?? []
  const currentIndex = flat.findIndex((entry) => entry.lessonSlug === lesson.slug)
  const prev = currentIndex > 0 ? flat[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null

  const isLecture = lesson.type === 'lecture'
  const isCourseLocked = courseAccess.lockedSlugs.has(courseSlug)
  // Lectures are the only type completed by clicking "Next"; other types finish
  // when their task/test passes, so we leave their navigation untouched.
  const canComplete = isLecture && !isCourseLocked

  const completeLecture = useCallback(() => {
    markCompleted({ courseSlug, lessonSlug: lesson.slug, lessonTitle: lesson.title })
    posthog.capture('lecture_completed', {
      course_slug: courseSlug,
      lesson_slug: lesson.slug,
      lesson_title: lesson.title,
    })
  }, [markCompleted, posthog, courseSlug, lesson.slug, lesson.title])

  const goToNext = useCallback(() => {
    if (next) {
      void router.navigate({
        to: '/courses/$courseSlug/$moduleSlug/$lessonSlug',
        params: { courseSlug, moduleSlug: next.moduleSlug, lessonSlug: next.lessonSlug },
      })
    } else {
      void router.navigate({ to: '/courses/$courseSlug', params: { courseSlug } })
    }
  }, [router, next, courseSlug])

  // Returning from sign-in with `?pendingNext`: finish the lecture the learner
  // was on and advance. Runs once (the ref guards re-fires / StrictMode), and
  // the completion toast comes from the mutation itself.
  const advancedRef = useRef(false)
  useEffect(() => {
    if (!pendingNext || advancedRef.current) return
    if (!session || !canComplete || !course) return
    advancedRef.current = true
    completeLecture()
    goToNext()
  }, [pendingNext, session, canComplete, course, completeLecture, goToNext])

  const handleNextClick = (e: React.MouseEvent) => {
    if (!canComplete) return // non-lecture / locked: let the NavTile link navigate
    if (!session) {
      e.preventDefault()
      setPromptOpen(true)
      return
    }
    completeLecture()
  }

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <NavTile direction="prev" target={prev} courseSlug={courseSlug} />
        <NavTile direction="next" target={next} courseSlug={courseSlug} onClick={handleNextClick} />
      </div>
      <SignInPromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        redirectTo={`${location.pathname}?pendingNext=1`}
        onContinue={() => {
          setPromptOpen(false)
          goToNext()
        }}
      />
    </>
  )
}

export type { NavTarget }
