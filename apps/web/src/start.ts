import { createStart } from '@tanstack/react-start'
import { markdownForAgents } from '@/lib/http/markdown-negotiation'

export const startInstance = createStart(() => ({
  requestMiddleware: [markdownForAgents],
}))
