import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CertificateNftSection } from './certificate-nft-section'
import type { PublicCertificate } from '@/lib/api/certificates'

interface CertificateActionsProps {
  certificate: PublicCertificate
  courseLine: string
  completionDate: string
  isOwner: boolean
}

export function CertificateActions({ certificate, courseLine, completionDate, isOwner }: CertificateActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Certificate link copied to clipboard')
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const { downloadCertificatePdf } = await import('@/components/ui/certificate-pdf')
      const filename = `${certificate.courseTitle.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`
      await downloadCertificatePdf(certificate.name, courseLine, completionDate, filename)
    } catch (error) {
      console.error(error)
      toast.error('Could not generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 print:hidden">
      <div className="flex flex-col gap-5 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-[60px] min-h-[60px] flex-1 border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={handleShare}
        >
          Copy link
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-[60px] min-h-[60px] flex-1 border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
        >
          Download PDF
        </Button>
      </div>
      {isOwner && <CertificateNftSection certificate={certificate} />}
    </div>
  )
}
