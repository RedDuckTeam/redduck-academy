import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { env } from '@/env'
import type { UserSettings } from '@/types/lesson'

export const fetchSessionFromCookie = createServerFn({ method: 'GET' }).handler(
  async (): Promise<UserSettings | null> => {
    const request = getRequest()
    const cookie = request?.headers.get('cookie')
    if (!cookie) return null

    const res = await fetch(`${env.VITE_API_URL}/api/user/settings`, {
      headers: { cookie },
    })
    if (!res.ok) return null

    const body = (await res.json()) as { data: UserSettings }
    return body.data
  },
)
