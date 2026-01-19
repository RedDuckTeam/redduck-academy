import { ProgressCard } from './progress-card'

export const ProgressCards = () => {
  return (
    <div className="flex border divide-x">
      <ProgressCard firstNum="150" secondNum="/200" text="points received" />
      <ProgressCard firstNum="75%" text="my success index" />
      <ProgressCard firstNum="2" secondNum="/6" text="tests passed " />
      <ProgressCard firstNum="1" text="place in ranking " />
    </div>
  )
}
