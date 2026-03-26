import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/components/providers/theme-context'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={cn(
        'relative cursor-pointer flex h-6 w-[53px] shrink-0 items-center rounded-[12px] p-0.5 transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        isDark ? 'border border-[#222222]' : 'bg-border',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 size-5 rounded-full z-10 transition-all duration-200 ease-out',
          isDark ? 'left-0.5 bg-primary' : 'left-[calc(100%-1.25rem-0.125rem)] bg-[#e0deda]',
        )}
        aria-hidden
      />
      <span
        className="pointer-events-none relative z-1 flex h-full w-full items-center justify-between px-0.5"
        aria-hidden
      >
        {!isDark ? (
          <>
            <Moon className="size-[18px] text-[#3a3a3a]" strokeWidth={2} />
            <span className="inline-block w-[27px]" />
          </>
        ) : (
          <>
            <span className="inline-block w-[27px]" />
            <Sun className="size-[18px] text-primary" strokeWidth={2} />
          </>
        )}
      </span>
    </button>
  )
}
