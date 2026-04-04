import { ProgressCard } from './progress-card'

export const ProgressCards = () => {
  return (
    <div className="flex border border-border divide-x divide-border">
      <ProgressCard firstNum="150" secondNum="/200" text="points received" />
      <ProgressCard firstNum="75%" text="my success index" />
      <ProgressCard firstNum="2" secondNum="/6" text="tests passed " />
      <ProgressCard firstNum="1" text="place in ranking " />
    </div>
  )
}
