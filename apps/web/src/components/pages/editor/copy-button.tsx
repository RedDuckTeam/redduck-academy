import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/editor/github-publish'
import { focusRing } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  label: string
  className?: string
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 3000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    if (await copyToClipboard(text)) {
      setCopied(true)
      return
    }
    toast.error('Could not copy to clipboard')
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('gap-2', focusRing, className)}
      onClick={copy}
    >
      {copied ? <Check className="size-4 lg:size-5" /> : <Copy className="size-4 lg:size-5" />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </Button>
  )
}
