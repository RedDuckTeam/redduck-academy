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

const steps = [
  'Fork the starter repository to your GitHub account.',
  'Clone your fork locally and complete the task.',
  'Commit and push your changes to your fork.',
  'Paste the link to your fork below and submit for review.',
]

export function HowToSubmitDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-fit cursor-pointer text-left text-sm text-secondary underline underline-offset-4 hover:text-foreground"
        >
          How to submit?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#000]">HOW TO SUBMIT</DialogTitle>
        </DialogHeader>
        <DialogBody className="gap-5">
          <ol className="flex flex-col gap-3 list-decimal pl-5">
            {steps.map((step) => (
              <li key={step}>
                <Text variant="main-16">{step}</Text>
              </li>
            ))}
          </ol>
          <Text variant="main-16" className="text-secondary">
            No local setup? You can also use GitHub Codespaces from your fork — open it in the browser, complete the
            task, and push from there.
          </Text>
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
