import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminPage } from '@/components/pages/admin/admin-page'
import { getAuthClient } from '@/lib/auth-client'
import type { UserRole } from '@/lib/auth-client'

function parseAdminPage(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

export const Route = createFileRoute('/admin')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    page: parseAdminPage(search.page),
    certPage: parseAdminPage(search.certPage),
  }),
  beforeLoad: async () => {
    const authClient = getAuthClient()
    const session = await authClient.getSession()
    const user = session?.data
      ? (session.data.user as typeof session.data.user & { role: UserRole })
      : undefined

    if (!user) {
      throw redirect({ to: '/sign-up' })
    }

    if (user.role !== 'admin') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminPage,
})
