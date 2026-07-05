import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export const NotFoundPage = () => {
  return (
    <main className="flex flex-col items-center justify-center py-20 sm:py-40 gap-8 px-6 text-center">
      <Text variant="title-80" className="text-primary">
        404
      </Text>
      <Text variant="subtitle-45">You've probably lost</Text>
      <Button asChild>
        <Link to="/">
          <Text variant="caps-24">Back to Home</Text>
        </Link>
      </Button>
    </main>
  )
}
