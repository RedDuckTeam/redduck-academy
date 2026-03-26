import { useState } from 'react'
import { Check } from 'lucide-react'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

const MOCK_TEST_CASES = [
  {
    id: '1',
    input: { nums: '[2, 7, 11, 15]', target: '9' },
    output: '[0, 1]',
  },
  {
    id: '2',
    input: { nums: '[3, 2, 4]', target: '6' },
    output: '[1, 2]',
  },
  {
    id: '3',
    input: { nums: '[3, 3]', target: '6' },
    output: '[0, 1]',
  },
]

export function TestCaseTabs() {
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('result')
  const [selectedCase, setSelectedCase] = useState(0)

  const currentCase = MOCK_TEST_CASES[selectedCase]

  return (
    <div className="flex flex-col border-t border-border">
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('testcase')}
          className={cn(
            'px-4 py-3 text-foreground',
            activeTab === 'testcase' ? 'border-b-2 border-primary' : 'text-muted-foreground',
          )}
        >
          <Text variant="caps-14" className={activeTab === 'testcase' ? 'text-primary' : 'text-muted-foreground'}>
            TESTCASE
          </Text>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('result')}
          className={cn(
            'flex items-center gap-2 px-4 py-3',
            activeTab === 'result' ? 'border-b-2 border-primary' : '',
          )}
        >
          <Check className="h-4 w-4 text-foreground" />
          <Text variant="caps-14" className={activeTab === 'result' ? 'text-primary' : 'text-muted-foreground'}>
            TEST RESULT
          </Text>
        </button>
      </div>

      <div className="flex min-h-[120px] flex-col gap-4 bg-muted p-4 dark:bg-[#1e1e1e]">
        <div className="flex gap-2 border-b border-border pb-2">
          {MOCK_TEST_CASES.map((_, index) => (
            <button
              key={MOCK_TEST_CASES[index].id}
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
          <button
            type="button"
            className="rounded bg-muted-foreground/15 px-3 py-1 text-sm text-muted-foreground hover:bg-secondary/50 dark:bg-[#2d2d2d] dark:text-white/70"
          >
            +
          </button>
        </div>

        {activeTab === 'result' && currentCase && (
          <div className="flex flex-col gap-3">
            <div>
              <Text variant="caps-14" className="mb-1 block text-muted-foreground">
                Input
              </Text>
              <div className="rounded-lg border border-border bg-card p-3 font-mono text-sm text-foreground dark:bg-[#2d2d2d] dark:text-[#d4d4d4]">
                <div>nums = {currentCase.input.nums}</div>
                <div>target = {currentCase.input.target}</div>
              </div>
            </div>
            <div>
              <Text variant="caps-14" className="mb-1 block text-muted-foreground">
                Output
              </Text>
              <div className="rounded-lg border border-border bg-card p-3 font-mono text-sm text-foreground dark:bg-[#2d2d2d] dark:text-[#d4d4d4]">
                {currentCase.output}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testcase' && (
          <Text variant="main-14" className="text-muted-foreground">
            Add or edit test cases (placeholder)
          </Text>
        )}
      </div>
    </div>
  )
}
