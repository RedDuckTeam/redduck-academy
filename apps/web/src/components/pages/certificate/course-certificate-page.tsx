import { useMemo } from 'react'
import { authClient } from '@/lib/auth-client'
import { Certificate } from '@/components/ui/certificate'
import { Button } from '@/components/ui/button'
import type { Course } from '@/types/lesson'

const SIGNATORY = {
  signature: 'Mark Virchenko',
  signatoryName: 'Mark Virchenko',
  signatoryTitle: 'Chief Executive Officer & Co-Founder',
} as const

function sealLabelFromTitle(title: string): string {
  const words = title.trim().split(/\s+/).slice(0, 5)
  return words.join(' ').toUpperCase()
}

function completionPhrase(courseTitle: string, description: string | undefined): string {
  const trimmed = description?.trim()
  if (trimmed && trimmed.length > 0) {
    return trimmed.length > 320 ? `${trimmed.slice(0, 317)}…` : trimmed
  }
  return `Congratulations on completing ${courseTitle}. This certificate recognizes your dedication and the skills you have built with RedDuck Academy.`
}

export interface CourseCertificatePageProps {
  course: Course
}

export function CourseCertificatePage({ course }: CourseCertificatePageProps) {
  const { data: session, isPending } = authClient.useSession()

  const recipientName = useMemo(() => {
    const user = session?.user as { name?: string; email?: string } | undefined
    if (user?.name?.trim()) return user.name.trim()
    const email = user?.email
    if (email) return email.split('@')[0] ?? 'Student'
    return 'Student'
  }, [session?.user])

  const completionDate = useMemo(
    () => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date()),
    [],
  )

  const courseLine = `${course.title} by RedDuck`
  const subtitle = `You finished ${course.title.toLowerCase()} by RedDuck`
  const bodyText = completionPhrase(course.title, course.description)

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = () => {
    window.print()
  }

  return (
    <div className="w-full bg-black px-6 py-14 text-white print:bg-white md:px-10 md:py-[60px]">
      <div className="mx-auto flex max-w-[880px] flex-col items-center gap-10 text-center print:hidden">
        <div className="flex flex-col gap-2.5 uppercase">
          <p className="text-[28px] font-medium leading-none md:text-[32px]">Congratulations!</p>
          <p className="text-[18px] font-normal leading-normal md:text-[20px]">{subtitle}</p>
        </div>
        <p className="font-inter max-w-[880px] text-[18px] leading-[1.4] text-white">{bodyText}</p>
      </div>

      <div className="certificate-print-root mx-auto flex w-full max-w-[880px] justify-center print:max-w-none print:py-0">
        <Certificate
          className="certificate-paper-surface max-w-[880px] shadow-[6px_6px_0px_0px_#000000]"
          recipientName={isPending ? '…' : recipientName}
          courseName={courseLine}
          completionDate={completionDate}
          sealCourseName={sealLabelFromTitle(course.title)}
          signature={SIGNATORY.signature}
          signatoryName={SIGNATORY.signatoryName}
          signatoryTitle={SIGNATORY.signatoryTitle}
        />
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-[880px] flex-col gap-5 sm:flex-row print:hidden">
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
          onClick={handleDownload}
        >
          Download
        </Button>
      </div>
    </div>
  )
}
