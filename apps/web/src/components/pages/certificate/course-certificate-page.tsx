import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Certificate } from '@/components/ui/certificate'
import { Button } from '@/components/ui/button'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { useUserCertificates } from '@/hooks/api/certificates/useUserCertificates'
import { useClaimCertificate } from '@/hooks/api/certificates/useClaimCertificate'
import { SetNameScreen } from './set-name-screen'

export interface CourseCertificatePageProps {
  course: Course
}

export function CourseCertificatePage({ course }: CourseCertificatePageProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: certificates, isLoading } = useUserCertificates()
  const { mutate: claim, isPending: isClaiming } = useClaimCertificate()

  const certificate = certificates?.find((c) => c.courseSlug === course.slug)

  const completionDate = certificate
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(certificate.issuedAt))
    : ''

  const courseLine = `${course.title} by RedDuck`
  const subtitle = `You finished ${course.title.toLowerCase()} by RedDuck`

  const handleClaim = (name: string) => {
    claim({ courseSlug: course.slug, name })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/certificates/${certificate?.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Certificate link copied to clipboard')
  }

  const handleDownloadImage = async () => {
    if (!certRef.current) return
    setIsDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `${course.title.replace(/\s+/g, '-').toLowerCase()}-certificate.png`
      a.click()
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) return null

  if (!certificate) {
    return <SetNameScreen onClaim={handleClaim} isLoading={isClaiming} />
  }

  return (
    <div className="w-full flex flex-col gap-10 px-6 py-14 md:px-10 md:py-[60px] bg-[#000]">
      <div className="mx-auto flex max-w-[880px] flex-col items-center gap-10 text-center text-white">
        <div className="flex flex-col gap-2.5">
          <Text variant={'subtitle-32'} className="font-medium">
            Congratulations!
          </Text>
          <Text variant={'caps-20'} className="">
            {subtitle}
          </Text>
        </div>
        <Text variant={'main-18'} className=" max-w-[880px]">
          This page shows your certificate for completing {course.title}. Use the buttons below to download a PNG copy
          or share the page on LinkedIn.
        </Text>
      </div>

      <div className="certificate-print-root mx-auto flex w-full max-w-[880px] justify-center print:max-w-none print:py-0">
        <Certificate
          ref={certRef}
          recipientName={certificate.name}
          courseName={courseLine}
          completionDate={completionDate}
        />
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
          onClick={handleDownloadImage}
          disabled={isDownloading}
        >
          {isDownloading ? 'Downloading…' : 'Download'}
        </Button>
      </div>
    </div>
  )
}
