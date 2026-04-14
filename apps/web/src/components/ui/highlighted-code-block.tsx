import { useEffect, useState, useCallback } from 'react'
import { Check, Copy } from 'lucide-react'
import { createHighlighter, type Highlighter } from 'shiki'
import type { CodingLanguage } from '@/types/lesson'
import { CODING_LANGUAGES } from '@/lib/utils'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['vesper'],
      langs: CODING_LANGUAGES,
    })
  }
  return highlighterPromise
}

interface HighlightedCodeBlockProps {
  code: string
  language?: string
}

export function HighlightedCodeBlock({ code, language }: HighlightedCodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const lang: CodingLanguage = CODING_LANGUAGES.includes(language as CodingLanguage)
    ? (language as CodingLanguage)
    : 'typescript'

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((hl) => {
      if (cancelled) return
      const result = hl.codeToHtml(code, { lang, theme: 'vesper' })
      setHtml(result)
    })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  return (
    <div className="relative my-6 overflow-hidden border border-border">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground dark:bg-[#2d2d2d] dark:text-white/50">
        <span>{language || 'code'}</span>
        <button type="button" onClick={handleCopy} aria-label="Copy code" className="flex items-center gap-1.5 ">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      {html ? (
        <div
          className="[&>pre]:overflow-x-auto [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-[14px] [&>pre]:leading-relaxed [&>pre]:m-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-[14px] leading-relaxed text-foreground dark:text-[#d4d4d4]">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
