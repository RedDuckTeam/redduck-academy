import { RotateCcw, WrapText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import type { Lesson } from '@/types/lesson'
import { IconButton } from './icon-button'
import { RunButton } from './run-button'
import { SubmitButton } from './submit-button'

interface CodePanelToolbarProps {
  language: Lesson['codingLanguage']
  isAuthenticated: boolean
  isPending: boolean
  isRunning: boolean
  canSubmit: boolean
  hasExecutableTests: boolean
  hasCode: boolean
  onFormat: () => void
  onReset: () => void
  onSignIn: () => void
  onSubmit: () => void
  onRun?: () => void
}

export function CodePanelToolbar(props: CodePanelToolbarProps) {
  const {
    language,
    isAuthenticated,
    isPending,
    isRunning,
    canSubmit,
    hasExecutableTests,
    hasCode,
    onFormat,
    onReset,
    onSignIn,
    onSubmit,
    onRun,
  } = props

  return (
    <div className="flex items-center border-b border-border py-2 px-4 justify-between shrink-0">
      <Text variant="main-16" className="capitalize">
        {language}
      </Text>
      <div className="ml-auto flex items-center gap-1">
        <IconButton Icon={WrapText} tooltip="Format code" onClick={onFormat} />
        <IconButton Icon={RotateCcw} tooltip="Reset code to starter template" onClick={onReset} />

        {!isAuthenticated ? (
          <Button size="sm" variant="default" onClick={onSignIn}>
            <Text variant="caps-14">Sign in</Text>
          </Button>
        ) : (
          <>
            {onRun && hasExecutableTests && (
              <RunButton onRun={onRun} isRunning={isRunning} disabled={isPending || !hasCode} />
            )}
            <SubmitButton onSubmit={onSubmit} isPending={isPending} disabled={!canSubmit} />
          </>
        )}
      </div>
    </div>
  )
}
