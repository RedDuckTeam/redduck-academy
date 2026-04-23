import { redirect } from '@tanstack/react-router'
import { getUserSettings } from '@/lib/api/user'

export async function requireAdminGuard() {
  let settings
  try {
    settings = await getUserSettings()
  } catch {
    throw redirect({ to: '/sign-up' })
  }
  if (!settings) throw redirect({ to: '/sign-up' })
  if (settings.role !== 'admin') throw redirect({ to: '/' })
}
