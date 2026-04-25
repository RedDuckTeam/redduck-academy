import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { banAdminUser } from '@/lib/api/admin'

export const useBanUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, ban }: { userId: string; ban: boolean }) => banAdminUser(userId, ban),
    onSuccess: (_, { ban }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(ban ? 'User banned' : 'User unbanned')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update ban status')
    },
  })
}
