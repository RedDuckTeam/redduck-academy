import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { getCertificateById } from '@/lib/api/certificates'
import { Certificate } from '@/components/ui/certificate'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { InfoModal } from '@/components/ui/info-modal'
import { useSession } from '@/hooks/useSession'
import { useRequestNft } from '@/hooks/api/certificates/useRequestNft'

export const Route = createFileRoute('/certificates/$certificateId')({
  ssr: true,
  loader: async ({ params }) => {
    try {
      return await getCertificateById(params.certificateId)
    } catch {
      throw notFound()
    }
  },
  component: CertificateRoute,
})

function CertificateRoute() {
  const certificate = Route.useLoaderData()
  const [isDownloading, setIsDownloading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { session } = useSession()
  const { mutate: requestNft, isPending: isRequestingNft } = useRequestNft()

  const isAuthenticated = !!session

  const completionDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    new Date(certificate.issuedAt),
  )
  const courseLine = `${certificate.courseTitle} by RedDuck`

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Certificate link copied to clipboard')
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const { downloadCertificatePdf } = await import('@/components/ui/certificate-pdf')
      await downloadCertificatePdf(
        certificate.name,
        courseLine,
        completionDate,
        `${certificate.courseTitle.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`,
      )
    } catch (error) {
      console.error(error)
      toast.error('Could not generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRequestNft = () => {
    setShowConfirmModal(false)
    requestNft(
      { certificateId: certificate.id },
      {
        onSuccess: () => setShowSuccessModal(true),
        onError: () => toast.error('Could not request NFT'),
      },
    )
  }

  const nftButtonLabel =
    certificate.status === 'claimed'
      ? 'NFT Received — Check Your Wallet'
      : certificate.status === 'requested'
        ? 'NFT Requested'
        : isRequestingNft
          ? 'Requesting…'
          : 'Request NFT'

  return (
    <main className="mb-[60px] flex min-h-screen flex-col gap-5 md:mx-[60px]">
      <div className="w-full flex flex-col gap-10 px-6 py-14 md:px-10 md:py-[60px] bg-[#000]">
        {isAuthenticated && (
          <div className="mx-auto flex max-w-[880px] flex-col items-center gap-10 text-center text-white">
            <div className="flex flex-col gap-2.5">
              <Text variant={'subtitle-32'} className="font-medium">
                Congratulations!
              </Text>
              <Text variant={'caps-20'}>You finished {certificate.courseTitle.toLowerCase()} by RedDuck</Text>
            </div>
            <Text variant={'main-18'} className="max-w-[880px]">
              This page shows your certificate for completing {certificate.courseTitle}. Download a PDF copy, share the
              link, or request an NFT to put it on-chain.
            </Text>
          </div>
        )}

        <div className="certificate-print-root mx-auto flex w-full max-w-[880px] justify-center print:max-w-none print:py-0">
          <Certificate recipientName={certificate.name} courseName={courseLine} completionDate={completionDate} />
        </div>

        <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 print:hidden">
          <div className="flex flex-col gap-5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-[60px] min-h-[60px] flex-1 border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={handleShare}
            >
              Share
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-[60px] min-h-[60px] flex-1 border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading…' : 'Download PDF'}
            </Button>
          </div>
          {isAuthenticated && (
            <Button
              type="button"
              variant="default"
              className="h-[60px] min-h-[60px] w-full"
              onClick={() => setShowConfirmModal(true)}
              disabled={certificate.status !== 'created' || isRequestingNft}
            >
              {nftButtonLabel}
            </Button>
          )}
        </div>

        <InfoModal
          open={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Request NFT Certificate"
          description="Your certificate will be minted as an NFT and will appear in your wallet soon."
          buttonLabel="Request"
          onConfirm={handleRequestNft}
        />
        <InfoModal
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Certificate Requested"
          description="Your NFT certificate has been requested. It will appear in your wallet soon."
        />

        {isAuthenticated && certificate.status === 'claimed' && certificate.tokenId && (
          <div className="mx-auto flex w-full max-w-[880px] flex-col items-center gap-2 text-center text-white/60 text-sm print:hidden">
            <p>Token ID: {certificate.tokenId}</p>
            {certificate.txHash && <p>Tx: {certificate.txHash}</p>}
          </div>
        )}
      </div>
    </main>
  )
}
