import { createFileRoute } from '@tanstack/react-router'
import { AdminPage } from '@/components/pages/admin/admin-page'

export const Route = createFileRoute('/admin/')({
  component: AdminPage,
})
