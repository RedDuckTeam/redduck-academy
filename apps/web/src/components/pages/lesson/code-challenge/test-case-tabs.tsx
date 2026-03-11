import { useState } from 'react'
import { Check } from 'lucide-react'
import { Text } from '@/components/ui/text'

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
          className={`px-4 py-3 ${activeTab === 'testcase' ? 'border-b-2 border-primary' : ''}`}
        >
          <Text variant="caps-14" className={activeTab === 'testcase' ? 'text-primary' : ''}>
            TESTCASE
          </Text>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('result')}
          className={`flex items-center gap-2 px-4 py-3 ${activeTab === 'result' ? 'border-b-2 border-primary' : ''}`}
        >
          <Check className="h-4 w-4" />
          <Text variant="caps-14" className={activeTab === 'result' ? 'text-primary' : ''}>
            TEST RESULT
          </Text>
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 bg-[#1e1e1e] min-h-[120px]">
        <div className="flex gap-2 border-b border-border pb-2">
          {MOCK_TEST_CASES.map((_, index) => (
            <button
              key={MOCK_TEST_CASES[index].id}
              type="button"
              onClick={() => setSelectedCase(index)}
              className={`px-3 py-1 rounded text-sm ${selectedCase === index ? 'bg-secondary text-white' : 'bg-[#2d2d2d] text-white/70'}`}
            >
              Case {index + 1}
            </button>
          ))}
          <button type="button" className="px-3 py-1 rounded text-sm bg-[#2d2d2d] text-white/70 hover:bg-secondary/50">
            +
          </button>
        </div>

        {activeTab === 'result' && currentCase && (
          <div className="flex flex-col gap-3">
            <div>
              <Text variant="caps-14" className="text-white/60 mb-1 block">
                Input
              </Text>
              <div className="rounded-lg border border-border bg-[#2d2d2d] p-3 font-mono text-sm text-[#d4d4d4]">
                <div>nums = {currentCase.input.nums}</div>
                <div>target = {currentCase.input.target}</div>
              </div>
            </div>
            <div>
              <Text variant="caps-14" className="text-white/60 mb-1 block">
                Output
              </Text>
              <div className="rounded-lg border border-border bg-[#2d2d2d] p-3 font-mono text-sm text-[#d4d4d4]">
                {currentCase.output}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testcase' && (
          <Text variant="main-14" className="text-white/60">
            Add or edit test cases (placeholder)
          </Text>
        )}
      </div>
    </div>
  )
}
