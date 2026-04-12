import { createAuthClient } from 'better-auth/react'
import { siweClient } from 'better-auth/client/plugins'
import { env } from '@/env'

type AuthClient = ReturnType<typeof createAuthClient>

let _authClient: AuthClient | null = null

export const getAuthClient = (): AuthClient => {
  if (!_authClient) {
    _authClient = createAuthClient({
      baseURL: env.VITE_API_URL,
      plugins: [siweClient()],
    })
  }
  return _authClient
}
