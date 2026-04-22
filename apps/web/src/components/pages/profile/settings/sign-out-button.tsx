import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'

export const SignOutButton = () => {
  const { logout } = usePrivyAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await logout()
    queryClient.clear()
    router.navigate({ to: '/sign-up' })
  }

  return (
    <Button type="button" variant="outline-white" className="self-start max-sm:w-full" onClick={handleSignOut}>
      <Text variant="caps-20">Sign out</Text>
    </Button>
  )
}
