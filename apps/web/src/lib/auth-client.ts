import { env } from '@/env'
import { createAuthClient } from 'better-auth/react'
import { siweClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  plugins: [siweClient()],
})
