import { useState } from 'react'
import { CodeEditor } from './code-editor'
import { TestCaseTabs } from './test-case-tabs'
import type { Lesson } from '@/types/lesson'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

interface CodePanelProps {
  lesson: Lesson
}

export function CodePanel({ lesson }: CodePanelProps) {
  const [code, setCode] = useState(lesson.boilerplate ?? '')

  return (
    <div className="flex flex-col ">
      <CodeEditor value={code} onChange={setCode} language={lesson.language === 'rust' ? 'rust' : 'solidity'} />

      <div className="flex gap-2 px-4 py-2 border-t border-border bg-[#2d2d2d]">
        <Button size="sm" onClick={() => {}}>
          <Text variant="caps-14">Run</Text>
        </Button>
        <Button size="sm" variant="secondary">
          <Text variant="caps-14">Submit</Text>
        </Button>
      </div>

      <TestCaseTabs />
    </div>
  )
}
