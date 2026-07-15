import { useEffect, useState, useCallback } from 'react'
import { Check, Copy } from 'lucide-react'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
// Import ONLY the languages/theme we use, directly. Importing the `bundledLanguages` /
// `bundledThemes` maps instead pulls every shiki grammar (~200 of them: emacs-lisp, wolfram,
// cpp…) into the bundle, and on Cloudflare Workers every module counts toward the size limit.
import typescript from '@shikijs/langs/typescript'
import rust from '@shikijs/langs/rust'
import solidity from '@shikijs/langs/solidity'
import vitesseDark from '@shikijs/themes/vitesse-dark'
import type { HighlighterCore } from 'shiki/core'
import type { CodingLanguage } from '@/types/lesson'
import { CODING_LANGUAGES } from '@/lib/utils'

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [vitesseDark],
      langs: [typescript, rust, solidity],
      engine: createJavaScriptRegexEngine(),
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

  const isHighlightable = CODING_LANGUAGES.includes(language as CodingLanguage)
  const lang: CodingLanguage | 'text' = isHighlightable ? (language as CodingLanguage) : 'text'

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const hl = await getHighlighter()
      if (cancelled) return
      setHtml(hl.codeToHtml(code, { lang, theme: 'vitesse-dark' }))
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [code, lang])

  return (
    <div className="relative overflow-hidden border border-border !my-2">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground dark:bg-[#2d2d2d] dark:text-white/50">
        <span>{isHighlightable ? lang : ''}</span>
        <button type="button" onClick={handleCopy} aria-label="Copy code" className="flex items-center gap-1.5">
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
