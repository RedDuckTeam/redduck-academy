import { useRef } from 'react'
import type { Ref } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { CodeEditor, type CodeEditorHandle } from './code-editor'
import type { CodingTaskSubmission, Lesson, LessonForUser } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RotateCcw, WrapText } from 'lucide-react'
import type { RateLimitError } from '@/lib/api/rate-limit'
import { getRateLimitCopy } from '@/lib/lessons/rate-limit-copy'
import { StatusBar } from '../status-bar'

interface CodePanelProps {
  lesson: Lesson
  userLesson: LessonForUser | null
  code: string
  onCodeChange: (value: string) => void
  onReset: () => void
  onSubmit: () => void
  onSignIn: () => void
  isAuthenticated: boolean
  isPending: boolean
  canSubmit: boolean
  rateLimitError: RateLimitError | null
}

export function CodePanel({
  lesson,
  userLesson,
  code,
  onCodeChange,
  onReset,
  onSubmit,
  onSignIn,
  isAuthenticated,
  isPending,
  canSubmit,
  rateLimitError,
}: CodePanelProps) {
  const editorRef = useRef<CodeEditorHandle>(null)
  const [statusParent] = useAutoAnimate({ duration: 180, easing: 'ease-in-out' })
  const language = lesson.codingLanguage ?? 'solidity'
  const submissions = (userLesson?.submissions as CodingTaskSubmission[]) ?? []
  const latest = submissions?.at(-1)
  // Hide status lines while a submit is in-flight so the user sees something react to their click.
  const showRateLimit = !!rateLimitError && !isPending
  const showLatest = !rateLimitError && !!latest && !isPending
  const rateLimitCopy = rateLimitError ? getRateLimitCopy(rateLimitError.reason, rateLimitError.resetAt) : ''

  return (
    <div className="flex flex-col xl:h-full">
      <div className="flex items-center border-b border-border py-2 px-4 justify-between shrink-0">
        <Text variant={'main-16'} className="capitalize">
          {lesson.codingLanguage}
        </Text>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-black "
                onClick={() => editorRef.current?.format()}
              >
                <WrapText className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Format code</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-black  " onClick={onReset}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset code to starter template</p>
            </TooltipContent>
          </Tooltip>
          {!isAuthenticated ? (
            <Button size="sm" variant="default" onClick={onSignIn}>
              <Text variant="caps-14">Sign in</Text>
            </Button>
          ) : (
            <span>
              <Button size="sm" variant="default" onClick={onSubmit} disabled={!canSubmit}>
                <Text variant="caps-14" className="flex items-center gap-1">
                  {isPending ? 'Pending' : 'Submit'}
                </Text>
              </Button>
            </span>
          )}
        </div>
      </div>
      <div className="min-h-[400px] xl:flex-1 xl:min-h-0 xl:overflow-hidden">
        <CodeEditor ref={editorRef} value={code} onChange={onCodeChange} language={language} />
      </div>
      <div ref={statusParent as Ref<HTMLDivElement>} className="shrink-0">
        {showLatest && <StatusBar key="latest" passed={latest!.passed} />}
        {showRateLimit && <StatusBar key="rate-limit" rateLimitMessage={rateLimitCopy} />}
      </div>
    </div>
  )
}
