import { DescriptionPanel } from './description-panel'
import { PanelHeader } from './panel-header'
import { CodePanel } from './code-panel'
import type { Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { FileIcon } from '@/components/ui/icons/file'
import { CodeIcon } from '@/components/ui/icons/code'

interface LessonCodeChallengeProps {
  lesson: Lesson
}

export function LessonCodeChallenge({ lesson }: LessonCodeChallengeProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      <div className="flex flex-col w-full ">
        <PanelHeader>
          <FileIcon className="w-5 h-5" />
          <Text variant="caps-14" className="text-white">
            DESCRIPTION
          </Text>
        </PanelHeader>
        <div className="flex flex-col p-5 border-b border-x border-border">
          <DescriptionPanel lesson={lesson} />
        </div>
      </div>
      <div className="gap-2.5 flex flex-col w-full">
        <div className="flex flex-col flex-1 w-full">
          <PanelHeader>
            <CodeIcon className="w-5 h-5" />
            <Text variant="caps-14" className="text-white">
              CODE
            </Text>
          </PanelHeader>
          <div className="flex flex-col py-5 border-b border-x border-border">
            <CodePanel lesson={lesson} />
          </div>
        </div>
        <div className="flex flex-col flex-1 w-full">
          <PanelHeader>
            <CodeIcon className="w-5 h-5" />
            <Text variant="caps-14" className="text-white">
              CODE
            </Text>
          </PanelHeader>
          <div className="flex flex-col p-5 border-b border-x border-border">
            <DescriptionPanel lesson={lesson} />
          </div>
        </div>
      </div>
    </div>
  )
}
