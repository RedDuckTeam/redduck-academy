import * as React from 'react'
import { cn } from '@/lib/utils'
import { createQrSvgPath } from '@/lib/qr'
import { RedDuckIcon } from '@/components/ui/icons/redduck'
import { CertificateStamp } from './icons/certificate-stamp'
import { MarkSignature } from './icons/mark-signature'

export interface CertificateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  recipientName: string
  courseName: string
  completionDate: string
  humanId?: string
  qrUrl?: string
}

// All sizes derived from Figma canvas 1920×1080.
// Padding/margin %  → always relative to containing block WIDTH (CSS spec).
// Width %           → relative to parent width.
// Height % on abs   → relative to containing block HEIGHT.
// Font sizes        → cqw (container query width unit, requires container-type below).

const Certificate = React.forwardRef<HTMLDivElement, CertificateProps>(
  ({ recipientName, courseName, completionDate, humanId, qrUrl, className, ...props }, ref) => {
    const qr = React.useMemo(() => (qrUrl ? createQrSvgPath(qrUrl) : null), [qrUrl])
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
            <RedDuckIcon className="w-[18cqw] h-auto max-w-full block" isDark />
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
            has successfully completed the course
          </p>
          {/* course — 120/1920=6.25% */}
          <p style={{ fontSize: '2.396cqw' }} className="text-[#000] font-medium mb-[6.25%]">
            {courseName}
          </p>
          {/* signature — w: 400/1920=20.833%, shifted down 60px (3.125% @ 1920) */}
          <div className="flex flex-col w-[20.833%] mt-[3.125%]">
            <MarkSignature className="w-full" />
            <p style={{ fontSize: '1.25cqw' }} className="mt-[2.083%] border-t w-full text-[#9b9b9b] border-border">
              Mark Virchenko
            </p>
            <p style={{ fontSize: '1.25cqw' }} className="text-[#9b9b9b]">
              Chief Executive Officer & Co-Founder
            </p>
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────────── */}
        {/* right: 60/1920=3.125%  w: 329.4/1920=17.156% (10% narrower)  h: 900/1080=83.333% */}
        {/* px: 28/1920=1.458%  py: 130/1920=6.771% */}
        <div className="absolute top-0 right-[3.125%] w-[17.156%] h-[83.333%] flex bg-primary flex-col items-center justify-between px-[1.458%] py-[6.771%]">
          <p style={{ fontSize: '1.458cqw' }} className="text-[#000] text-center uppercase font-medium leading-tight">
            Course certificate
          </p>
          <CertificateStamp className="w-[71.585%] h-fit" />
        </div>

        {/* Decorative red square at its ORIGINAL position (right-[21.167%]), QR inside. */}
        {/* w/h: 95/1920, 95/1080 — bottom: 60/1080, right: 406.4/1920=21.167% */}
        {/* Inner QR sized to 95% of the square so the visible "padding" stays a constant
            proportion of the square at any display width. */}
        <div className="absolute bottom-[5.556%] right-[21.167%] w-[4.948%] h-[8.796%] bg-primary flex items-center justify-center">
          {qr && (
            <svg
              viewBox={`0 0 ${qr.size} ${qr.size}`}
              shapeRendering="crispEdges"
              aria-label="Certificate QR code"
              preserveAspectRatio="xMidYMid meet"
              className="block w-[95%] h-[95%]"
            >
              <path d={qr.path} fill="#000" />
            </svg>
          )}
        </div>

        {/* ID — anchored to the right of the square with a small proportional gap. */}
        {/* square's right edge from cert left: 100% - 21.167% = 78.833%. Plus 0.313% gap (~6px @ 1920). */}
        {humanId && (
          <div
            className="absolute bottom-[5.556%] h-[8.796%] flex items-center text-[#9b9b9b] whitespace-nowrap"
            style={{ fontSize: '1.302cqw', left: '79.146%' }}
          >
            ID: {humanId}
          </div>
        )}
      </article>
    )
  },
)

Certificate.displayName = 'Certificate'

export { Certificate }
