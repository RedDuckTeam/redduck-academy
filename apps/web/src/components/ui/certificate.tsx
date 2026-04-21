import * as React from 'react'
import { cn } from '@/lib/utils'
import { RedDuckIcon } from '@/components/ui/icons/redduck'
import { CertificateStamp } from './icons/certificate-stamp'
import { MarkSignature } from './icons/mark-signature'
import { Text } from './text'

export interface CertificateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  recipientName: string
  courseName: string
  completionDate: string
}

// All sizes derived from Figma canvas 1920×1080.
// Padding/margin %  → always relative to containing block WIDTH (CSS spec).
// Width %           → relative to parent width.
// Height % on abs   → relative to containing block HEIGHT.
// Font sizes        → cqw (container query width unit, requires container-type below).

const Certificate = React.forwardRef<HTMLDivElement, CertificateProps>(
  ({ recipientName, courseName, completionDate, className, ...props }, ref) => {
    return (
      <article
        ref={ref}
        role="document"
        aria-label={`Course certificate for ${courseName}`}
        className={cn(
          // aspect ratio + layout
          'relative aspect-[1920/1080] flex flex-col w-full overflow-hidden bg-[#E0DEDA]',
          // padding: px % from 1920 (60/1920, 60/1920, 180/1920)
          'py-[3.125%] pl-[3.125%] pr-[9.375%]',
          // enable container queries so cqw works for font sizes
          '[container-type:inline-size]',
          className,
        )}
        {...props}
      >
        {/* ── Header row ──────────────────────────────────────────── */}
        <div className="flex">
          {/* logo cell: pl/pt/pb/pr → 20/1920, 20/1920, 40/1920, 40/1920 */}
          {/* logo: 186×24 @ 1920 — same as certificate-pdf (93×12 @ 960); w = 186/1920 → 9.6875cqw */}
          <div className="pl-[1.042%] pt-[1.042%] pb-[2.083%] pr-[2.083%] border-b border-border shrink-0">
            <RedDuckIcon className="w-[18cqw] h-auto max-w-full" isDark />
          </div>
          <div className="w-full flex-1 border-t border-l h-full border-border" />
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        {/* pl: 120/1920=6.25%  pt: 180/1920=9.375% */}
        <div className="w-full h-full flex pl-[6.25%] pt-[9.375%] flex-col border-b border-x border-border">
          {/* date — 10/1920=0.521% */}
          <p style={{ fontSize: '1.458cqw', lineHeight: 1.143 }} className="text-[#565653] mb-[0.521%]">
            {completionDate}
          </p>
          {/* recipient — 40/1920=2.083% */}
          <p style={{ fontSize: '2.396cqw' }} className="text-[#000] font-medium mb-[2.083%]">
            {recipientName}
          </p>
          <p style={{ fontSize: '1.458cqw' }} className="text-[#565653] mb-[0.521%]">
            has successfully completed
          </p>
          {/* course — 120/1920=6.25% */}
          <p style={{ fontSize: '2.396cqw' }} className="text-[#000] font-medium mb-[6.25%]">
            {courseName}
          </p>
          {/* signature — 20/1920=1.042%  w: 400/1920=20.833% */}
          <div className="flex flex-col w-[20.833%]">
            <MarkSignature className="w-full" />
            <Text style={{ fontSize: '1.25cqw' }} className="border-t w-full text-[#9b9b9b] border-border">
              Mark Virchenko
            </Text>
            <p style={{ fontSize: '1.25cqw' }} className="text-[#9b9b9b]">
              Chief Executive Officer & Co-Founder
            </p>
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────────── */}
        {/* right: 60/1920=3.125%  w: 366/1920=19.0625%  h: 900/1080=83.333% */}
        {/* px: 28/1920=1.458%  py: 130/1920=6.771% */}
        <div className="absolute top-0 right-[3.125%] w-[19.0625%] h-[83.333%] flex bg-primary flex-col items-center justify-between px-[1.458%] py-[6.771%]">
          <p style={{ fontSize: '1.458cqw' }} className="text-[#000] text-center uppercase font-medium leading-tight">
            Course certificate
          </p>
          <CertificateStamp className="w-[71.585%] h-fit" />
        </div>

        {/* w/h: 95/1920, 95/1080 — bottom: 60/1080, right: 443/1920 */}
        <div className="absolute bottom-[5.556%] right-[23.073%] w-[4.948%] h-[8.796%] bg-primary" />
      </article>
    )
  },
)

Certificate.displayName = 'Certificate'

export { Certificate }
