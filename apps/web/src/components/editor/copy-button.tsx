import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/editor/github-publish'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  label: string
  className?: string
}

/**
 * Reports the real outcome rather than flashing "Copied" on hope. Every path out of this editor
 * runs through the clipboard, so a copy that silently did nothing costs the contributor their work.
 */
export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 3000)
    return () => clearTimeout(timer)
  }, [state])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        'gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        className,
      )}
      onClick={async () => setState((await copyToClipboard(text)) ? 'copied' : 'failed')}
    >
      {state === 'copied' ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Couldn’t copy, select it by hand' : label}
      </span>
    </Button>
  )
}
