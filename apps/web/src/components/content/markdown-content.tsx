import { memo, useMemo, useRef } from 'react'
import type { Components } from 'react-markdown'
import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toHtml } from 'hast-util-to-html'
import type { Element, Node } from 'hast'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { HighlightedCodeBlock } from '@/components/ui/highlighted-code-block'
import { BlockMiningSimulator } from '@/components/ui/block-mining-simulator'
import { createSlugDeduper } from '@/components/pages/lesson/toc/build-toc-items'
import { ErrorBoundary } from '@/components/error-boundary'
import { anchorStyles, blockquoteStyles, codeStyles, svgWrapperClass } from './rich-content-styles'
import { BLOCK_MINING_SHORTCODE, detectEmbed } from './embeds'
import { markdownRehypePlugins } from './markdown-sanitize'

interface MarkdownContentProps {
  source: string
  className?: string
  paragraphClassName?: string
}

// Unordered-list marker: a small square drawn with a ::before pseudo-element. Specific to
// this renderer's list DOM shape (RichText uses an explicit <span> marker instead).
const ulMarker =
  "[&>li]:relative [&>li]:pl-6 [&>li]:before:content-[''] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.5em] [&>li]:before:h-2.5 [&>li]:before:w-2.5 [&>li]:before:bg-black dark:[&>li]:before:bg-white"

const REMARK_PLUGINS = [remarkGfm]

function hastText(node: Node | undefined): string {
  if (!node) return ''
  const n = node as { type?: string; value?: string; children?: Node[] }
  if (n.type === 'text') return n.value ?? ''
  return (n.children ?? []).map(hastText).join('')
}

export const MarkdownContent = memo(function MarkdownContent({
  source,
  className,
  paragraphClassName,
}: MarkdownContentProps) {
  // Mirror the TOC's slug-dedup so heading ids match its hrefs (shared implementation). It counts
  // as it goes, so it has to start over on every render — while the components map below has to
  // survive them: a fresh object literal is a fresh element type for every tag, which makes React
  // unmount and rebuild the rendered tree. In the editor's live preview that meant every code block
  // dropping back to plain text and re-running Shiki on each pause in typing.
  const dedupeRef = useRef(createSlugDeduper())
  dedupeRef.current = createSlugDeduper()

  // Diagrams are multi-line raw <svg>. react-markdown/rehype-raw only reassembles a raw
  // element reliably when it is one inline token, so collapse newlines within each
  // <svg>…</svg> block (whitespace between SVG tags is insignificant). Nothing else changes.
  const prepared = useMemo(() => source.replace(/<svg[\s\S]*?<\/svg>/gi, (m) => m.replace(/\r?\n/g, ' ')), [source])

  const components = useMemo<Components>(() => {
    const heading =
      (variant: 'subtitle-32' | 'caps-24' | 'caps-20', element: 'h1' | 'h2' | 'h3') =>
      ({ node, children }: { node?: Element; children?: ReactNode }) => (
        <div id={node ? dedupeRef.current(hastText(node).trim()) : undefined} className="scroll-mt-20">
          <Text variant={variant} element={element} className="mb-3! font-medium">
            {children}
          </Text>
        </div>
      )

    return {
      h1: heading('subtitle-32', 'h1'),
      h2: heading('caps-24', 'h2'),
      h3: heading('caps-20', 'h3'),
      p: ({ node, children }) => {
        const kids = (node?.children ?? []).filter((k) => !(k.type === 'text' && !k.value.trim()))
        // Raw <svg> diagrams parse as inline HTML inside a paragraph. react-markdown
        // renders their children (<path>, <rect>…) in the HTML namespace, which breaks
        // them. Serialize the already-sanitized svg node (rehype-sanitize ran in the
        // pipeline) back to a string so the browser's parser gets the SVG namespace right.
        const svgNodes = kids.filter((k): k is Element => k.type === 'element' && k.tagName === 'svg')
        if (svgNodes.length > 0) {
          const html = svgNodes.map((n) => toHtml(n, { space: 'svg' })).join('')
          return <div className={svgWrapperClass} dangerouslySetInnerHTML={{ __html: html }} />
        }
        if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'a') {
          const embed = detectEmbed(String(kids[0].properties?.href ?? ''))
          if (embed) return embed
        }
        if (hastText(node).trim() === BLOCK_MINING_SHORTCODE) return <BlockMiningSimulator />
        return (
          <Text variant="main-18" className={cn('leading-[23px]', paragraphClassName)}>
            {children}
          </Text>
        )
      },
      a: ({ href, children }) => {
        // Internal links (resolved to /courses/... paths by the dumper) navigate in the
        // same tab; external links open in a new tab.
        const internal = typeof href === 'string' && href.startsWith('/')
        return internal ? (
          <a href={href} className="text-primary underline">
            {children}
          </a>
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            {children}
          </a>
        )
      },
      ul: ({ children }) => <ul className={cn('my-2 list-none space-y-1', ulMarker)}>{children}</ul>,
      ol: ({ children }) => <ol className="my-2 list-decimal list-outside space-y-1 pl-6 ml-1">{children}</ol>,
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
      table: ({ children }) => (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-[16px]">{children}</table>
        </div>
      ),
      th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-medium">{children}</th>,
      td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
      // Fenced code -> highlighted block. We render the block here and skip <pre>'s
      // children, so the inline `code` mapping only ever sees inline code.
      pre: ({ node }) => {
        const codeEl = (node?.children ?? []).find((c): c is Element => c.type === 'element' && c.tagName === 'code')
        const cls = ((codeEl?.properties?.className as string[] | undefined) ?? []).join(' ')
        const lang = /language-(\w+)/.exec(cls)?.[1]
        const code = hastText(codeEl).replace(/\n$/, '')
        return <HighlightedCodeBlock code={code} language={lang} />
      },
      code: ({ children }) => <code>{children}</code>,
    }
  }, [paragraphClassName])

  if (!source) return null

  return (
    <ErrorBoundary>
      <div className={cn(blockquoteStyles, anchorStyles, codeStyles, className, 'w-full [&>*]:mb-6')}>
        <Markdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={markdownRehypePlugins} components={components}>
          {prepared}
        </Markdown>
      </div>
    </ErrorBoundary>
  )
})
