import type { ReactNode } from 'react'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'

interface HowToSubmitDialogProps {
  taskName: string
}

const codeCls = 'font-mono text-[0.95em] bg-muted px-1 py-0.5 rounded'

function buildSteps(taskName: string): ReactNode[] {
  return [
    <>Fork the starter repository to your GitHub account.</>,
    <>
      Clone your fork and open <code className={codeCls}>{taskName}/TASK.md</code> for the task description and grading
      criteria.
    </>,
    <>
      Complete the task, then commit and push your changes to the <code className={codeCls}>main</code> branch of your
      fork.
    </>,
    <>
      Paste the link to your fork below and submit for review. The URL should look like{' '}
      <code className={codeCls}>https://github.com/your-username/your-fork</code>. It must be a fork of the starter, not
      a fresh repo.
    </>,
  ]
}

export function HowToSubmitDialog({ taskName }: HowToSubmitDialogProps) {
  const steps = buildSteps(taskName)
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-fit cursor-pointer text-left text-sm text-secondary underline underline-offset-4 hover:text-foreground"
        >
          How to submit
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#000]">HOW TO SUBMIT</DialogTitle>
        </DialogHeader>
        <DialogBody className="gap-5">
          <ol className="flex flex-col gap-3 list-decimal pl-5">
            {steps.map((step, i) => (
              <li key={i}>
                <Text variant="main-16">{step}</Text>
              </li>
            ))}
          </ol>
          <DialogClose asChild>
            <Button type="button" className="w-full mt-2">
              <Text variant="caps-20">GOT IT</Text>
            </Button>
          </DialogClose>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
