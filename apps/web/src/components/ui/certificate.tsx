import * as React from 'react'
import { cn } from '@/lib/utils'
import { RedDuckIcon } from '@/components/ui/icons/redduck'
import { CertificateSeal } from '@/components/ui/certificate-seal'
import { CertificateStampDark } from './icons/certificate-stamp-dark'

export interface CertificateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Recipient's full name */
  recipientName: string
  /** Course or achievement title (e.g. "Blockchain development course by RedDuck") */
  courseName: string
  /** Date of completion (formatted string) */
  completionDate: string
  /** Signatory's printed name */
  signatoryName: string
  /** Signatory's title (e.g. "Chief Executive Officer & Co-Founder") */
  signatoryTitle: string
  /** Signatory's signature - text rendered in script style, or image URL */
  signature?: string
  /** Short course name for seal inner ring (e.g. "BLOCKCHAIN DEVELOPMENT") */
  sealCourseName?: string
}

const Certificate = React.forwardRef<HTMLDivElement, CertificateProps>(
  (
    {
      recipientName,
      courseName,
      completionDate,
      signatoryName,
      signatoryTitle,
      signature,
      sealCourseName,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <article
        ref={ref}
        role="document"
        aria-label={`Course certificate for ${courseName}`}
        className={cn(
          'relative flex w-full max-w-[900px] overflow-hidden',
          'bg-background border border-border',
          'shadow-[6px_6px_0px_0px_var(--foreground)]',
          className,
        )}
        {...props}
      >
        {/* Left section - main content */}
        <div className="relative flex flex-1 flex-col px-8 py-10 md:px-12 md:py-14">
          {/* Logo top left */}
          <div className="flex items-center gap-4">
            <RedDuckIcon className="h-6 w-auto [&_path:first-of-type]:fill-primary [&_path:not(:first-of-type)]:fill-foreground md:h-7" />
            <div className="h-px flex-1 bg-border" aria-hidden />
          </div>

          {/* Date */}
          <p className="mt-6 font-inter text-[14px] text-secondary">{completionDate}</p>

          {/* Recipient name - prominent */}
          <h2 className="mt-4 font-inter text-[28px] font-bold text-foreground md:text-[32px]">{recipientName}</h2>

          {/* Completion phrase */}
          <p className="mt-2 font-inter text-[16px] text-secondary md:text-[18px]">has successfully completed</p>

          {/* Course name */}
          <p className="mt-2 font-inter text-[20px] font-bold text-foreground md:text-[24px]">{courseName}</p>

          {/* Signature block */}
          <div className="mt-auto pt-12">
            {signature && (
              <p
                className="font-[cursive] text-[24px] text-foreground md:text-[28px]"
                style={{ fontFamily: 'Dancing Script, Segoe Script, cursive' }}
              >
                {signature}
              </p>
            )}
            <div className="mt-2 h-px w-32 bg-border" aria-hidden />
            <p className="mt-1 font-inter text-[16px] font-medium text-foreground">{signatoryName}</p>
            <p className="font-inter text-[14px] text-secondary">{signatoryTitle}</p>
          </div>

          {/* Decorative square - bottom left */}
          <div className="absolute bottom-0 left-0 h-4 w-4 bg-foreground" aria-hidden />
        </div>

        {/* Right section - black strip with seal */}
        <div className="relative flex w-[min(280px,35%)] flex-col items-center justify-between bg-header px-6 py-10">
          {/* Course certificate title - top right */}
          <p className="self-end font-inter text-[12px] font-medium uppercase tracking-widest text-header-foreground md:text-[14px]">
            Course Certificate
          </p>

          {/* Circular seal */}
          <div className="flex flex-1 items-center justify-center py-6">
            <CertificateStampDark isLight={true} className="size-[262px]" />
          </div>

          {/* Decorative square - bottom right (cutout effect) */}
          <div className="absolute bottom-0 right-0 h-4 w-4 bg-background" aria-hidden />
        </div>
      </article>
    )
  },
)

Certificate.displayName = 'Certificate'

export { Certificate }
