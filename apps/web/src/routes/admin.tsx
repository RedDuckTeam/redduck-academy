import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useUserSettings } from '@/hooks/api/user/useUserSettings'

type AdminTab = 'general' | 'users' | 'certificates' | 'lessons' | 'costs'

function parseTab(raw: unknown): AdminTab {
  const allowed: AdminTab[] = ['general', 'users', 'certificates', 'lessons', 'costs']
  return typeof raw === 'string' && (allowed as string[]).includes(raw) ? (raw as AdminTab) : 'general'
}

export const Route = createFileRoute('/admin')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseTab(search.tab),
  }),
  ssr: false,
  component: AdminLayout,
})

function AdminLayout() {
  const { data: settings, isError, isPending } = useUserSettings()
  const router = useRouter()

  useEffect(() => {
    if (isPending) return
    if (isError || !settings) {
      void router.navigate({ to: '/sign-up', replace: true })
      return
    }
    if (settings.role !== 'admin') {
      void router.navigate({ to: '/dashboard', replace: true })
    }
  }, [settings, isError, isPending, router])

  if (!settings || settings.role !== 'admin') return null
  return <Outlet />
}
