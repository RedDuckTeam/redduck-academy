import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getAuthClient } from '@/lib/auth-client'
import { Text } from '@/components/ui/text'

export const SignOutButton = () => {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await getAuthClient().signOut()
      if (error) {
        toast.error('Failed to sign out. Please try again.')
        return
      }
      router.navigate({ to: '/sign-up' })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline-white"
      className="self-start max-sm:w-full"
      disabled={isSigningOut}
      onClick={handleSignOut}
    >
      <Text variant="caps-20">Sign out</Text>
    </Button>
  )
}
