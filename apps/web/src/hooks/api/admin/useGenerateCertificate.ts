import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWriteContract, useSwitchChain } from 'wagmi'
import { toast } from 'sonner'
import { generateAdminCertificate } from '@/lib/api/admin'
import { certificateAbi } from '@/constants/abi/certificateAbi'
import { activeChain, certificateContractAddress } from '@/constants/chain'

export const useGenerateCertificate = () => {
  const queryClient = useQueryClient()
  const { writeContractAsync } = useWriteContract()
  const { switchChainAsync } = useSwitchChain()

  return useMutation({
    mutationFn: async ({ userId, courseSlug }: { userId: string; courseSlug: string }) => {
      await switchChainAsync({ chainId: activeChain.id })

      const mintParams = await generateAdminCertificate({ userId, courseSlug })

      const tx = await writeContractAsync({
        address: certificateContractAddress,
        abi: certificateAbi,
        functionName: 'mint',
        args: [
          mintParams.walletAddress as `0x${string}`,
          BigInt(mintParams.courseId),
          mintParams.contentHash as `0x${string}`,
          mintParams.metadataUri,
        ],
        chainId: activeChain.id,
      })
    },
    onSuccess: () => {
      toast.success('Certificate minted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'certificates'] })
    },
    onError: (error) => {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to mint certificate')
    },
  })
}
