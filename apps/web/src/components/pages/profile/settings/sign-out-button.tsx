import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { usePrivyAuth } from '@/components/providers/privy-auth-context'

export const SignOutButton = () => {
  const { logout } = usePrivyAuth()

  const handleSignOut = async () => {
    await logout()
    window.location.assign('/sign-up')
  }

  return (
    <Button type="button" variant="outline-white" className="self-start max-sm:w-full" onClick={handleSignOut}>
      <Text variant="caps-20">Sign out</Text>
    </Button>
  )
}
