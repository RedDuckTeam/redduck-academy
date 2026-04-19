import { useState } from 'react'
import { toast } from 'sonner'
import { useRequestNft } from './useRequestNft'
import type { PublicCertificate } from '@/lib/api/certificates'

export function useCertificateNft(certificate: Pick<PublicCertificate, 'id' | 'status'>) {
  const [status, setStatus] = useState(certificate.status)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { mutate: requestNft, isPending } = useRequestNft()

  const handleRequest = () => {
    setShowConfirm(false)
    requestNft(
      { certificateId: certificate.id },
      {
        onSuccess: () => {
          setStatus('requested')
          setShowSuccess(true)
        },
        onError: () => toast.error('Could not request NFT'),
      },
    )
  }

  const buttonLabel =
    status === 'claimed'
      ? 'NFT Received — Check Your Wallet'
      : status === 'requested'
        ? 'NFT Requested'
        : isPending
          ? 'Requesting…'
          : 'Request NFT'

  return {
    status,
    showConfirm,
    setShowConfirm,
    showSuccess,
    setShowSuccess,
    handleRequest,
    isPending,
    buttonLabel,
  }
}
