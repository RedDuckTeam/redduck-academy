import { useCallback, useEffect, useRef, useState } from 'react'
import { getRouteApi, useLocation, useRouter } from '@tanstack/react-router'
import { NavTile } from './nav-tile'
import { SignInPromptModal } from '../sign-in-prompt-modal'
import type { Lesson } from '@/types/lesson'
import { adjacentLessons } from '@/lib/lessons/lesson-nav'
import { useCourse } from '@/hooks/api/courses/useCourse'
import { useSession } from '@/hooks/useSession'
import { useMarkLessonCompleted } from '@/hooks/api/lessons/useMarkLessonCompleted'
import { useCourseAccess } from '@/hooks/api/user/useUserCourseAccess'
import { dismissSignInPrompt, isSignInPromptDismissed } from '@/lib/sign-in-prompt'
import { usePostHog } from '@posthog/react'

interface LessonNavigationProps {
  courseSlug: string
  lesson: Lesson
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
  const { moduleSlug } = lessonRoute.useParams()
  const [promptOpen, setPromptOpen] = useState(false)

  // Prev/next come from the course's reading order, each carrying its real module slug so a
  // move across a module boundary navigates to the correct URL.
  const { prev, next } = adjacentLessons(course?.data, moduleSlug, lesson.slug)

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

  // Lesson context attached to every prompt funnel event (matches `lecture_completed`).
  const promptEventProps = { course_slug: courseSlug, lesson_slug: lesson.slug, lesson_title: lesson.title }

  const handleNextClick = (e: React.MouseEvent) => {
    if (!canComplete) return // non-lecture / locked: let the NavTile link navigate
    if (session) {
      completeLecture()
      return // the NavTile link navigates to the next lesson
    }
    // Logged out: nudge once per session, then let them continue freely. If they
    // already dismissed it this session, don't prevent navigation.
    if (isSignInPromptDismissed()) return
    e.preventDefault()
    setPromptOpen(true)
    posthog.capture('sign_in_prompt_shown', promptEventProps)
  }

  // Any dismissal (continue or close) silences the nudge for the rest of the session.
  const dismissPrompt = (method: 'continue' | 'close') => {
    dismissSignInPrompt()
    setPromptOpen(false)
    posthog.capture('sign_in_prompt_dismissed', { ...promptEventProps, method })
  }

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <NavTile direction="prev" target={prev} courseSlug={courseSlug} />
        <NavTile direction="next" target={next} courseSlug={courseSlug} onClick={handleNextClick} />
      </div>
      <SignInPromptModal
        open={promptOpen}
        onClose={() => dismissPrompt('close')}
        redirectTo={`${location.pathname}?pendingNext=1`}
        onContinue={() => {
          dismissPrompt('continue')
          goToNext()
        }}
        onSignIn={() => posthog.capture('sign_in_prompt_sign_in_clicked', promptEventProps)}
      />
    </>
  )
}

export type { NavTarget } from '@/lib/lessons/lesson-nav'
