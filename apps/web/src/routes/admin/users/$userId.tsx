import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users/$userId')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  ssr: false,
  component: Outlet,
})
