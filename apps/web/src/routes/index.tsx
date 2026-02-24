import { Link, createFileRoute } from '@tanstack/react-router'
import { Progress } from '@/components/pages/home/progress/progress'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="flex flex-col min-h-screen">
      <Progress />
      <div className="px-[60px] pb-8">
        <Link to="/courses" className="text-primary hover:underline text-sm">
          Browse courses →
        </Link>
      </div>
    </main>
  )
}
