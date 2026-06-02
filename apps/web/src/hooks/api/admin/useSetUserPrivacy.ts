import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { setAdminUserPrivacy } from '@/lib/api/admin'

export const useSetUserPrivacy = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isPrivate }: { userId: string; isPrivate: boolean }) =>
      setAdminUserPrivacy(userId, isPrivate),
    onSuccess: (_, { isPrivate }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(isPrivate ? 'Profile set to private' : 'Profile set to public')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update privacy')
    },
  })
}
