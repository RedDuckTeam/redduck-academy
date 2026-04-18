import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Certificate } from '@/components/ui/certificate'
import { Button } from '@/components/ui/button'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { useUserCertificates } from '@/hooks/api/certificates/useUserCertificates'
import { useClaimCertificate } from '@/hooks/api/certificates/useClaimCertificate'
import { useRequestNft } from '@/hooks/api/certificates/useRequestNft'

export interface CourseCertificatePageProps {
  course: Course
}

export function CourseCertificatePage({ course }: CourseCertificatePageProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const claimStarted = useRef(false)

  const { data: certificates, isLoading } = useUserCertificates()
  const { mutate: claim, isPending: isClaiming, isError, isSuccess, reset } = useClaimCertificate()
  const { mutate: requestNft, isPending: isRequestingNft } = useRequestNft()

  const certificate = certificates?.find((c) => c.courseSlug === course.slug)

  const completionDate = certificate
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(certificate.issuedAt))
    : ''

  const courseLine = `${course.title} by RedDuck`
  const subtitle = `You finished ${course.title.toLowerCase()} by RedDuck`

  const tryClaim = useCallback(() => {
    claim(
      { courseSlug: course.slug },
      {
        onError: () => {
          toast.error('Could not issue certificate')
        },
      },
    )
  }, [claim, course.slug])

  useEffect(() => {
    reset()
    claimStarted.current = false
  }, [course.slug, reset])

  useEffect(() => {
    if (isLoading || certificate) return
    if (claimStarted.current) return
    claimStarted.current = true
    tryClaim()
  }, [isLoading, certificate, tryClaim])

  const handleShare = async () => {
    const url = `${window.location.origin}/certificates/${certificate?.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Certificate link copied to clipboard')
  }

  const handleDownloadPdf = async () => {
    if (!certificate) return
    setIsDownloading(true)
    try {
      const { downloadCertificatePdf } = await import('@/components/ui/certificate-pdf')
      await downloadCertificatePdf(
        certificate.name,
        courseLine,
        completionDate,
        `${course.title.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`,
      )
    } catch {
      toast.error('Could not generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRequestNft = () => {
    if (!certificate) return
    requestNft(
      { certificateId: certificate.id },
      {
        onSuccess: () => toast.success('NFT request submitted'),
        onError: () => toast.error('Could not request NFT'),
      },
    )
  }

  if (isLoading || (!certificate && (isClaiming || isSuccess))) return null

  if (!certificate && isError) {
    return (
      <div className="w-full flex flex-col gap-10 px-6 py-14 md:px-10 md:py-[60px] bg-[#000]">
        <div className="mx-auto flex max-w-[880px] flex-col items-center gap-6 text-center text-white">
          <Text variant="main-18" className="text-secondary">
            We could not issue your certificate right now.
          </Text>
          <Button
            type="button"
            variant="outline"
            className="h-[60px] min-h-[60px] border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              reset()
              claimStarted.current = false
              tryClaim()
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (!certificate) return null

  const nftButtonLabel =
    certificate.status === 'claimed'
      ? 'NFT Claimed'
      : certificate.status === 'requested'
        ? 'NFT Requested'
        : isRequestingNft
          ? 'Requesting…'
          : 'Request NFT'

  return (
    <div className="w-full flex flex-col gap-10 px-6 py-14 md:px-10 md:py-[60px] bg-[#000]">
      <div className="mx-auto flex max-w-[880px] flex-col items-center gap-10 text-center text-white">
        <div className="flex flex-col gap-2.5">
          <Text variant={'subtitle-32'} className="font-medium">
            Congratulations!
          </Text>
          <Text variant={'caps-20'}>{subtitle}</Text>
        </div>
        <Text variant={'main-18'} className="max-w-[880px]">
          This page shows your certificate for completing {course.title}. Download a PDF copy, share
          the link, or request an NFT to put it on-chain.
        </Text>
      </div>

      <div className="certificate-print-root mx-auto flex w-full max-w-[880px] justify-center print:max-w-none print:py-0">
        <Certificate recipientName={certificate.name} courseName={courseLine} completionDate={completionDate} />
      </div>

      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 sm:flex-row print:hidden">
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
        <Button
          type="button"
          variant="outline"
          className="h-[60px] min-h-[60px] flex-1 border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={handleRequestNft}
          disabled={certificate.status !== 'created' || isRequestingNft}
        >
          {nftButtonLabel}
        </Button>
      </div>

      {certificate.status === 'claimed' && certificate.tokenId && (
        <div className="mx-auto flex w-full max-w-[880px] flex-col items-center gap-2 text-center text-white/60 text-sm print:hidden">
          <p>Token ID: {certificate.tokenId}</p>
          {certificate.txHash && <p>Tx: {certificate.txHash}</p>}
        </div>
      )}
    </div>
  )
}
