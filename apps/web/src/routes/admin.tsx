import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getUserSettings } from '@/lib/api/user'

type AdminTab = 'general' | 'users' | 'certificates'

function parseTab(raw: unknown): AdminTab {
  const allowed: AdminTab[] = ['general', 'users', 'certificates']
  return typeof raw === 'string' && (allowed as string[]).includes(raw) ? (raw as AdminTab) : 'general'
}

export const Route = createFileRoute('/admin')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseTab(search.tab),
  }),
  beforeLoad: async () => {
    let settings
    try {
      settings = await getUserSettings()
    } catch {
      throw redirect({ to: '/sign-up' })
    }

    if (!settings) throw redirect({ to: '/sign-up' })
    if (settings.role !== 'admin') throw redirect({ to: '/dashboard' })
  },
  component: Outlet,
})
