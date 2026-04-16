import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwitchProps {
  id?: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
  className?: string
}

function Switch({ id, checked, onCheckedChange, className }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative cursor-pointer flex h-6 w-[46px] shrink-0 items-center rounded-[12px] p-0.5 transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        checked ? 'bg-primary' : 'bg-border',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 size-5 rounded-full z-10 transition-all duration-200 ease-out bg-background',
          checked ? 'left-[calc(100%-1.25rem-0.125rem)]' : 'left-0.5',
        )}
        aria-hidden
      />
      <span
        className="pointer-events-none relative z-1 flex h-full w-full items-center justify-between px-0.5"
        aria-hidden
      >
        {checked ? (
          <>
            <Check className="size-[16px] text-background" strokeWidth={2.5} />
            <span className="inline-block w-[27px]" />
          </>
        ) : (
          <>
            <span className="inline-block w-[27px]" />
            <X className="size-[16px] text-muted-foreground" strokeWidth={2.5} />
          </>
        )}
      </span>
    </button>
  )
}

export { Switch }
