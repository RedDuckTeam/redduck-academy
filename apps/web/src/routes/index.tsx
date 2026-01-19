import { Progress } from '@/components/pages/home/progress/progress'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="flex flex-col min-h-screen">
      <Progress />
    </main>
  )
}
