import { useMemo, useRef, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Certificate } from '@/components/ui/certificate'
import { Button } from '@/components/ui/button'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'

export interface CourseCertificatePageProps {
  course: Course
}

export function CourseCertificatePage({ course }: CourseCertificatePageProps) {
  const { data: session, isPending } = authClient.useSession()
  const certRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const recipientName = useMemo(() => {
    const user = session?.user as { name?: string; email?: string } | undefined
    if (user?.name?.trim()) return user.name.trim()
    const email = user?.email
    if (email) return email.split('@')[0] ?? 'Student'
    return 'Student'
  }, [session?.user])

  const completionDate = useMemo(() => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date()), [])

  const courseLine = `${course.title} by RedDuck`
  const subtitle = `You finished ${course.title.toLowerCase()} by RedDuck`

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'noopener,noreferrer')
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
          recipientName={isPending ? '…' : recipientName}
          courseName={courseLine}
          completionDate={completionDate}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 sm:flex-row print:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-[60px] min-h-[60px] flex-1 border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={handleShareLinkedIn}
        >
          Share to LinkedIn
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
