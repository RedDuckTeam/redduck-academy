import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users/$userId')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: Outlet,
})
