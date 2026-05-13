import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'

export const SignOutButton = () => {
  const { logout } = usePrivyAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await logout()
      queryClient.clear()
      await router.invalidate()
      await router.navigate({ to: '/sign-up' })
    } finally {
      setIsSigningOut(false)
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline-white"
        className="self-start max-sm:w-full"
        onClick={() => setIsDialogOpen(true)}
      >
        <Text variant="caps-20">Sign out</Text>
      </Button>
      <ConfirmDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleSignOut}
        title="Sign out?"
        description="You'll need to sign in again to access your courses and progress."
        confirmLabel="Sign out"
        isLoading={isSigningOut}
      />
    </>
  )
}
