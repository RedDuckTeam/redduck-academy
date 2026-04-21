import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWriteContract, useSwitchChain, usePublicClient } from 'wagmi'
import { parseEventLogs } from 'viem'
import { toast } from 'sonner'
import { generateAdminCertificate, markAdminClaimed } from '@/lib/api/admin'
import { certificateAbi } from '@/constants/abi/certificateAbi'
import { activeChain, certificateContractAddress } from '@/constants/chain'

export const useGenerateCertificate = () => {
  const queryClient = useQueryClient()
  const { writeContractAsync } = useWriteContract()
  const { switchChainAsync } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: activeChain.id })

  return useMutation({
    mutationFn: async ({ userId, courseSlug }: { userId: string; courseSlug: string }) => {
      await switchChainAsync({ chainId: activeChain.id })

      const mintParams = await generateAdminCertificate({ userId, courseSlug })

      const toastId = toast.loading('Waiting for wallet signature...')

      try {
        const txHash = await writeContractAsync({
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

        toast.loading('Waiting for transaction confirmation...', { id: toastId })

        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })

        const logs = parseEventLogs({ abi: certificateAbi, eventName: 'CertificateMinted', logs: receipt.logs })
        const tokenId = logs[0]?.args.tokenId
        if (tokenId === undefined) throw new Error('CertificateMinted event not found in receipt')

        if (mintParams.certificateId) {
          await markAdminClaimed(mintParams.certificateId, {
            metadataUri: mintParams.metadataUri,
            imageUrl: mintParams.imageUrl,
            tokenId: tokenId.toString(),
            txHash,
          })
        }

        const txUrl = `${activeChain.blockExplorers?.default.url}/tx/${txHash}`
        toast.success('Certificate minted successfully', {
          id: toastId,
          action: { label: 'View transaction', onClick: () => window.open(txUrl, '_blank') },
        })
      } catch (err) {
        toast.dismiss(toastId)
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'certificates'] })
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes('User rejected the request')) return
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to mint certificate')
    },
  })
}
