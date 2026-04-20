import type { CSSProperties } from 'react'
import { CheckCircle, InfoIcon, Loader2, TriangleAlert, XCircle } from 'lucide-react'
import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'

import { useTheme } from '@/components/providers/theme-context'

/**
 * Toast shell aligned with RedDuck course Figma tokens (file kL27uFMvF5uzHWkgUAJMRq):
 * main-14px (Inter 14), border #9B9B9B, surfaces from --popover / --card, accent #ED4937,
 * error red #F22E1A, warning tint #E8B5A9, secondary text #565653.
 */
// Avoid `!transition-*` here: Sonner’s injected stylesheet animates transform/opacity/height on `[data-sonner-toast]`; important foreground-only transitions override it and kill motion.
const toastShell = '!flex !items-center !gap-3 !rounded-none !border !border-border !px-4 !py-3 !shadow-sm'

/** Figma `main-14px`: Inter Regular 14 — see Text variant `main-14`. */
const toastTitle = 'font-inter text-[14px] leading-[18px] min-h-[18px] !font-normal !leading-[18px]'

function ToasterInner({ ...props }: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CheckCircle className="h-4 w-4 shrink-0 text-white" aria-hidden />,
        info: <InfoIcon className="h-4 w-4 shrink-0 text-secondary" aria-hidden />,
        warning: <TriangleAlert className="h-4 w-4 shrink-0 text-[#565653] dark:text-[#E0CDC6]" aria-hidden />,
        error: <XCircle className="h-4 w-4 shrink-0 text-white" aria-hidden />,
        loading: <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" aria-hidden />,
      }}
      toastOptions={{
        classNames: {
          toast: `${toastShell} !bg-popover !text-popover-foreground`,
          title: toastTitle,
          description: 'font-inter text-[13px] leading-snug text-muted-foreground',
          success: [
            toastShell,
            '!border-success !bg-success',
            '[&_[data-title]]:!text-white [&_[data-description]]:!text-white',
          ].join(' '),
          error: [
            toastShell,
            '!border-[#F22E1A] !bg-primary',
            '[&_[data-title]]:!text-white [&_[data-description]]:!text-white',
          ].join(' '),
          warning: [
            toastShell,
            '!border-[#565653] !bg-[#E8B5A9]',
            '[&_[data-title]]:!text-[#565653] [&_[data-description]]:!text-[#565653] dark:[&_[data-title]]:!text-[#E0CDC6] dark:[&_[data-description]]:!text-[#E0CDC6]',
          ].join(' '),
          info: [
            toastShell,
            '!border-border !bg-card',
            '[&_[data-title]]:!text-foreground [&_[data-description]]:!text-muted-foreground',
          ].join(' '),
          loading: [
            toastShell,
            '!border-primary !bg-primary',
            '[&_[data-title]]:!text-white [&_[data-description]]:!text-white',
          ].join(' '),
          default: [
            toastShell,
            '!bg-popover [&_[data-title]]:!text-foreground [&_[data-description]]:!text-muted-foreground',
          ].join(' '),
        },
      }}
      style={
        {
          '--border-radius': '0',
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  return <ToasterInner {...props} />
}

export { Toaster }
