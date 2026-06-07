import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/providers/theme-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LazyPrivyProvider } from './privy-provider'

export const Providers = ({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) => {
  return (
    <LazyPrivyProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </LazyPrivyProvider>
  )
}
