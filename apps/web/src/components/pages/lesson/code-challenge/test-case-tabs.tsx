import { useState } from 'react'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import type { CodingTestCase } from '@/types/lesson'

interface TestCaseTabsProps {
  testCases: CodingTestCase[]
}

export function TestCaseTabs({ testCases }: TestCaseTabsProps) {
  const [selectedCase, setSelectedCase] = useState(0)
  const currentCase = testCases[selectedCase]

  if (testCases.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col border-t border-border">
      <div className="flex border-b border-border px-4 py-2">
        <Text variant="caps-14" className="text-muted-foreground">
          TEST CASES
        </Text>
      </div>

      <div className="flex min-h-[120px] flex-col gap-4 bg-muted p-4 dark:bg-[#1e1e1e]">
        <div className="flex gap-2 border-b border-border pb-2">
          {testCases.map((tc, index) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => setSelectedCase(index)}
              className={cn(
                'rounded px-3 py-1 text-sm',
                selectedCase === index
                  ? 'bg-secondary text-foreground dark:text-white'
                  : 'bg-muted-foreground/15 text-muted-foreground dark:bg-[#2d2d2d] dark:text-white/70',
              )}
            >
              Case {index + 1}
            </button>
          ))}
        </div>

        {currentCase && (
          <div className="flex flex-col gap-2">
            <Text variant="main-14" className="font-medium text-foreground">
              {currentCase.title}
            </Text>
            {currentCase.description && (
              <Text variant="main-14" className="text-muted-foreground">
                {currentCase.description}
              </Text>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
