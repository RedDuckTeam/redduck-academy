import * as React from 'react'
import { cn } from '@/lib/utils'
import { DuckIcon } from '@/components/ui/icons/duck'

interface CertificateSealProps {
  /** Course name for inner ring (e.g. "BLOCKCHAIN DEVELOPMENT") */
  courseName: string
  className?: string
}

/** Circular seal with RedDuck branding for certificates */
const CertificateSeal = React.forwardRef<SVGSVGElement, CertificateSealProps>(
  ({ courseName, className }, ref) => {
    const innerText = courseName.toUpperCase().replace(/\s+/g, ' ')
    const outerText = 'REDDUCK COURSE CERTIFICATE'

    return (
      <svg
        ref={ref}
        viewBox="0 0 160 160"
        className={cn('w-full max-w-[140px]', className)}
        aria-hidden
      >
        <defs>
          {/* Top arc - text reads along the top */}
          <path
            id="seal-top-arc"
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
          />
          {/* Bottom arc - text reads along the bottom */}
          <path
            id="seal-bottom-arc"
            d="M 140 80 A 60 60 0 0 1 20 80"
            fill="none"
          />
        </defs>
        {/* Outer circle */}
        <circle
          cx="80"
          cy="80"
          r="72"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        {/* Inner circle */}
        <circle
          cx="80"
          cy="80"
          r="58"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />
        {/* Top curved text */}
        <text
          fill="white"
          fontSize="8"
          fontWeight="500"
          letterSpacing="0.1em"
          fontFamily="Inter, sans-serif"
        >
          <textPath href="#seal-top-arc" startOffset="50%" textAnchor="middle">
            {outerText}
          </textPath>
        </text>
        {/* Bottom curved text - course name */}
        <text
          fill="white"
          fontSize="7"
          fontWeight="500"
          letterSpacing="0.05em"
          fontFamily="Inter, sans-serif"
        >
          <textPath href="#seal-bottom-arc" startOffset="50%" textAnchor="middle">
            {innerText}
          </textPath>
        </text>
        {/* Center duck logo - scaled to fit inner circle */}
        <g transform="translate(70, 76) scale(0.4)">
          <DuckIcon className="[&_path]:fill-primary!" />
        </g>
      </svg>
    )
  },
)

CertificateSeal.displayName = 'CertificateSeal'

export { CertificateSeal }
