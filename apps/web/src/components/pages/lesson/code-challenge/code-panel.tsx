import { useRef } from 'react'
import type { Ref } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { CodeEditor, type CodeEditorHandle } from './code-editor'
import type { CodingTaskSubmission, Lesson, LessonForUser } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle, Clock, RotateCcw, WrapText, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RateLimitError } from '@/lib/api/rate-limit'
import { getRateLimitCopy } from '@/lib/lessons/rate-limit-copy'

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
  const rateLimitCopy = rateLimitError
    ? getRateLimitCopy(rateLimitError.reason, rateLimitError.resetAt)
    : ''

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
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="default" onClick={onSubmit} disabled={!canSubmit}>
                    <Text variant="caps-14" className="flex items-center gap-1">
                      {isPending ? 'Pending' : 'Submit'}
                    </Text>
                  </Button>
                </span>
              </TooltipTrigger>
              {rateLimitError && (
                <TooltipContent>
                  <p>{rateLimitCopy}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </div>
      <div className="min-h-[400px] xl:flex-1 xl:min-h-0 xl:overflow-hidden">
        <CodeEditor ref={editorRef} value={code} onChange={onCodeChange} language={language} />
      </div>
      <div ref={statusParent as Ref<HTMLDivElement>} className="shrink-0">
        {showLatest && (
          <div
            key="latest"
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-t transition-colors border-border',
              latest!.passed ? 'bg-success/10' : 'bg-primary/10',
            )}
          >
            {latest!.passed ? (
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-primary shrink-0" />
            )}
            <Text variant="main-14" className={latest!.passed ? 'text-success' : 'text-primary'}>
              {latest!.passed ? 'Passed' : 'Not passed'}
            </Text>
          </div>
        )}
        {showRateLimit && (
          <div
            key="rate-limit"
            className="flex items-center gap-2 px-4 py-2 border-t border-border bg-yellow-500/10"
          >
            <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
            <Text variant="main-14" className="text-yellow-500">
              {rateLimitCopy}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
