import { Link } from '@tanstack/react-router'
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

interface SignInPromptModalProps {
  open: boolean
  onClose: () => void
  /** Relative href to return to after sign-in (the current lesson, flagged to auto-advance). */
  redirectTo: string
  /** Proceed to the next lesson without an account (progress isn't saved). */
  onContinue: () => void
  /** Fired when the learner clicks "Sign in" (before navigating away). */
  onSignIn: () => void
}

export function SignInPromptModal({ open, onClose, redirectTo, onContinue, onSignIn }: SignInPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#000]">Congratulations!</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-6">
          <Text variant="main-18" className="text-secondary">
            Sign in to save your progress and keep your streak.
          </Text>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/sign-up" search={{ redirect: redirectTo }} onClick={onSignIn}>
                <Text variant="caps-20">Sign in</Text>
              </Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={onContinue}>
              <Text variant="caps-20">Continue without saving</Text>
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
