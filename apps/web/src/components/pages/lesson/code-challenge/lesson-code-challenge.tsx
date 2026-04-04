import { useState } from 'react'
import { DescriptionPanel } from './description-panel'
import { PanelHeader } from './panel-header'
import { CodePanel } from './code-panel'
import { CodingTaskResult } from './coding-task-result'
import type { LessonForUser } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { FileIcon } from '@/components/ui/icons/file'
import { CodeIcon } from '@/components/ui/icons/code'
import { CheckSquare, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LessonCodeChallengeProps {
  lesson: LessonForUser
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
}

export function LessonCodeChallenge({ lesson, courseSlug, lessonSlug }: LessonCodeChallengeProps) {
  const starterCode = lesson.starterCode ?? ''
  const [code, setCode] = useState(starterCode)

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 lg:flex-row">
      <div className="flex flex-col w-full ">
        <PanelHeader>
          <FileIcon className="w-5 h-5" />
          <Text variant="caps-14">DESCRIPTION</Text>
        </PanelHeader>
        <div className="flex flex-col p-5 border-b border-x border-border">
          <DescriptionPanel lesson={lesson} />
        </div>
      </div>
      <div className="gap-2.5 flex flex-col w-full">
        <div className="flex flex-col flex-1 w-full">
          <PanelHeader>
            <CodeIcon className="w-5 h-5" />
            <Text variant="caps-14">CODE</Text>
            <div className="ml-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-[#e0deda] hover:text-white hover:bg-white/10"
                      onClick={() => setCode(starterCode)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset code to starter template</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </PanelHeader>
          <div className="flex flex-col py-5 border-b border-x border-border">
            <CodePanel
              lesson={lesson}
              courseSlug={courseSlug}
              lessonSlug={lessonSlug}
              code={code}
              onCodeChange={setCode}
            />
          </div>
        </div>
        <div className="flex flex-col flex-1 w-full">
          <PanelHeader>
            <CheckSquare className="w-5 h-5" />
            <Text variant="caps-14">RESULT</Text>
          </PanelHeader>
          <div className="flex flex-col border-b border-x border-border">
            <CodingTaskResult lesson={lesson} />
          </div>
        </div>
      </div>
    </div>
  )
}
