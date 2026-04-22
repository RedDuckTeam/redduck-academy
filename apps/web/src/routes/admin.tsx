import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminPage } from '@/components/pages/admin/admin-page'
import { getUserSettings } from '@/lib/api/user'

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
    let settings
    try {
      settings = await getUserSettings()
    } catch {
      throw redirect({ to: '/sign-up' })
    }

    if (!settings) throw redirect({ to: '/sign-up' })
    if (settings.role !== 'admin') throw redirect({ to: '/' })
  },
  component: AdminPage,
})
