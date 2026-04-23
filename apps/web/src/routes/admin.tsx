import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminPage } from '@/components/pages/admin/admin-page'
import { getUserSettings } from '@/lib/api/user'

function parseAdminPage(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

function parseStr(raw: unknown, allowed: string[], fallback: string): string {
  return typeof raw === 'string' && allowed.includes(raw) ? raw : fallback
}

function parseSearch(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}

export const Route = createFileRoute('/admin')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    page: parseAdminPage(search.page),
    userSort: parseStr(search.userSort, ['email', 'name', 'username', 'createdAt', 'lessonsPassed', 'coursesPassed'], 'createdAt') as 'email' | 'name' | 'username' | 'createdAt' | 'lessonsPassed' | 'coursesPassed',
    userSortDir: parseStr(search.userSortDir, ['asc', 'desc'], 'desc') as 'asc' | 'desc',
    userSearch: parseSearch(search.userSearch),
    certPage: parseAdminPage(search.certPage),
    certSort: parseStr(search.certSort, ['issuedAt', 'userEmail', 'courseSlug', 'status', 'name'], 'issuedAt') as 'issuedAt' | 'userEmail' | 'courseSlug' | 'status' | 'name',
    certSortDir: parseStr(search.certSortDir, ['asc', 'desc'], 'desc') as 'asc' | 'desc',
    certStatus: parseStr(search.certStatus, ['all', 'created', 'requested', 'claimed'], 'all') as 'all' | 'created' | 'requested' | 'claimed',
    certSearch: parseSearch(search.certSearch),
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
