import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export const ErrorPage = ({ reset }: Partial<ErrorComponentProps>) => {
  return (
    <main className="flex flex-col items-center justify-center py-20 sm:py-40 gap-8 px-6 text-center">
      <Text variant="title-80" className="text-primary">
        Oops
      </Text>
      <Text variant="subtitle-45">Something went wrong</Text>
      <div className="flex flex-col sm:flex-row gap-4">
        {reset ? (
          <Button variant="outline" onClick={() => reset()}>
            <Text variant="caps-24">Try again</Text>
          </Button>
        ) : null}
        <Button asChild>
          <Link to="/dashboard">
            <Text variant="caps-24">Back to Dashboard</Text>
          </Link>
        </Button>
      </div>
    </main>
  )
}
