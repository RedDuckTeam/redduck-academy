import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminPage } from '@/components/pages/admin/admin-page'
import { getAuthClient } from '@/lib/auth-client'
import type { UserRole } from '@/lib/auth-client'

export const Route = createFileRoute('/admin')({
  ssr: false,
  beforeLoad: async () => {
    const authClient = getAuthClient()
    const session = await authClient.getSession()
    const user = session?.data?.user as (typeof session.data.user & { role: UserRole }) | undefined

    if (!user) {
      throw redirect({ to: '/sign-up' })
    }

    if (user.role !== 'admin') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminPage,
})
