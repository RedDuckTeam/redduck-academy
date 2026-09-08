import { RichText as PayloadRichText, ListJSXConverter } from '@payloadcms/richtext-lexical/react'
import { Link } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { HighlightedCodeBlock } from '@/components/ui/highlighted-code-block'
import { BlockMiningSimulator } from '@/components/ui/block-mining-simulator'
import { createSlugDeduper, extractText } from '@/components/pages/lesson/toc/build-toc-items'
import { ErrorBoundary } from '@/components/error-boundary'
import { anchorStyles, blockquoteStyles, codeStyles, svgWrapperClass } from './rich-content-styles'
import { BLOCK_MINING_SHORTCODE, detectEmbed } from './embeds'

type EnrichedLessonDoc = {
  href?: string
  navigation?: { courseSlug: string; moduleSlug: string; lessonSlug: string }
}

interface CustomRichTextProps {
  data?: Record<string, any> | null
  className?: string
  paragraphClassName?: string
}

const ulMarkerClassName = 'mt-[0.45em] h-2.5 w-2.5 shrink-0 bg-black dark:bg-white'

export function RichText({ data, className, paragraphClassName }: CustomRichTextProps) {
  if (!data) return null

  // Mirrors the TOC's slug-dedup so heading ids match the TOC's hrefs even when Lexical
  // splits a heading across multiple text nodes (e.g. mixed inline formatting)
  const nextHeadingId = createSlugDeduper()

  // Pasted multi-line SVG markup arrives as one paragraph per line. Buffer across paragraphs
  // and emit the full SVG when </svg> is reached; continuation paragraphs render nothing.
  let svgBuffer: string | null = null

  const svgClass = svgWrapperClass

  const renderSvg = (markup: string) => {
    const raw = markup ?? ''

    // Diagrams carry an authored <title>/<desc> + role="img" baked into the SVG
    // markup so crawlers, AI, and screen readers get a real description. Render
    // those verbatim.
    if (/<title[\s>]/i.test(raw)) {
      return <div className={svgClass} dangerouslySetInnerHTML={{ __html: raw }} />
    }

    // Fallback for any diagram without a baked-in <title>: derive a name from the
    // SVG's <text> labels and inject a <title> + role="img" so it isn't invisible.
    let label: string | undefined
    try {
      const textNodes = [...raw.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
        .map((m) => m[1]?.replace(/<[^>]+>/g, '').trim() ?? '')
        .filter(Boolean)
      label = textNodes.join(', ') || undefined
    } catch {
      label = undefined
    }
    let html = raw
    if (label) {
      const esc = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const openTag = html.match(/<svg\b[^>]*>/i)?.[0]
      if (openTag) {
        const withRole = /\brole=/.test(openTag) ? openTag : openTag.replace(/<svg\b/i, '<svg role="img"')
        html = html.replace(openTag, `${withRole}<title>${esc}</title>`)
      }
    }
    return (
      <div
        {...(label ? {} : { role: 'img', 'aria-label': 'Diagram' })}
        className={svgClass}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className={cn(blockquoteStyles, anchorStyles, codeStyles, className, 'w-full')}>
        <PayloadRichText
          className="*:mb-6"
          data={data as any}
          converters={({ defaultConverters }) => ({
            ...defaultConverters,
            heading: ({ node, nodesToJSX }) => {
              const tag = node.tag as 'h1' | 'h2' | 'h3'
              const config: Record<
                string,
                {
                  variant: 'subtitle-32' | 'caps-24' | 'caps-20' | 'main-18'
                  element: 'h1' | 'h2' | 'h3' | 'p'
                }
              > = {
                h1: { variant: 'subtitle-32', element: 'h1' },
                h2: { variant: 'caps-24', element: 'h2' },
                h3: { variant: 'caps-20', element: 'h3' },
              }
              const { variant, element } = config[tag] ?? {
                variant: 'main-18' as const,
                element: 'p' as const,
              }
              const id = nextHeadingId(extractText(node).trim())
              return (
                <div id={id} className="scroll-mt-20">
                  <Text variant={variant} element={element} className="mb-3! font-medium">
                    {nodesToJSX({ nodes: node.children })}
                  </Text>
                </div>
              )
            },
            paragraph: ({ node, nodesToJSX }) => {
              const rawText = (node.children as Array<{ type?: string; text?: string }>)
                .map((c) => (c.type === 'text' ? (c.text ?? '') : c.type === 'linebreak' ? '\n' : ''))
                .join('')

              if (svgBuffer !== null) {
                svgBuffer += '\n' + rawText
                if (svgBuffer.trimEnd().endsWith('</svg>')) {
                  const markup = svgBuffer.trim()
                  svgBuffer = null
                  return renderSvg(markup)
                }
                return <></>
              }

              const trimmed = rawText.trim()
              if (trimmed.startsWith('<svg')) {
                if (trimmed.endsWith('</svg>')) return renderSvg(trimmed)
                svgBuffer = rawText
                return <></>
              }

              const textNode = node.children[0] as unknown as { type?: string; fields?: { url?: string } }
              if (textNode?.type === 'autolink' || textNode?.type === 'link') {
                const embed = detectEmbed(textNode.fields?.url ?? '')
                if (embed) return embed
              }
              if (trimmed === BLOCK_MINING_SHORTCODE) {
                return <BlockMiningSimulator />
              }
              return (
                <Text variant="main-18" className={cn('leading-[23px]', paragraphClassName)}>
                  {nodesToJSX({ nodes: node.children })}
                </Text>
              )
            },
            upload: ({ node }) => {
              const value = node.value as unknown as { url: string; alt: string; width: number; height: number }
              return (
                <div className="w-full">
                  <img
                    src={value.url}
                    alt={value.alt}
                    className={cn(paragraphClassName, 'w-full object-contain')}
                    style={{ maxWidth: value.width, maxHeight: value.height }}
                  />
                </div>
              )
            },
            link: ({ node, nodesToJSX }) => {
              const children = nodesToJSX({ nodes: node.children })
              const rel = node.fields?.newTab ? 'noopener noreferrer' : undefined
              const target = node.fields?.newTab ? '_blank' : undefined
              const doc = node.fields?.doc as EnrichedLessonDoc | null | undefined

              if (node.fields?.linkType === 'internal' && doc?.navigation) {
                const href =
                  doc.href ??
                  `/courses/${doc.navigation.courseSlug}/${doc.navigation.moduleSlug}/${doc.navigation.lessonSlug}`
                if (node.fields?.newTab) {
                  return (
                    <a href={href} rel={rel} target={target} className="text-primary underline">
                      {children}
                    </a>
                  )
                }
                return (
                  <Link
                    to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
                    params={{
                      courseSlug: doc.navigation.courseSlug,
                      moduleSlug: doc.navigation.moduleSlug,
                      lessonSlug: doc.navigation.lessonSlug,
                    }}
                    className="text-primary underline"
                  >
                    {children}
                  </Link>
                )
              }

              let href = node.fields?.url ?? ''
              if (node.fields?.linkType === 'internal') {
                href = typeof doc?.href === 'string' ? doc.href : '#'
              }
              return (
                <a href={href} rel={rel} target={'_blank'} className="text-primary underline">
                  {children}
                </a>
              )
            },
            list: (args) => {
              const { node, nodesToJSX } = args
              if (node.listType === 'check') {
                const listConverter = ListJSXConverter.list
                if (typeof listConverter === 'function') {
                  return listConverter(args)
                }
              }
              const children = nodesToJSX({ nodes: node.children })
              const Tag = node.tag
              if (node.listType === 'number') {
                return <Tag className={cn('my-2 list-decimal list-outside space-y-1 pl-6 ml-1')}>{children}</Tag>
              }
              return <Tag className={cn('my-2 list-none space-y-1')}>{children}</Tag>
            },
            listitem: (args) => {
              const { node, nodesToJSX, parent } = args
              if ('listType' in parent && parent.listType === 'check') {
                const listItemConverter = ListJSXConverter.listitem
                if (typeof listItemConverter === 'function') {
                  return listItemConverter(args)
                }
              }
              const hasSubLists = node.children.some((child) => child.type === 'list')
              const children = nodesToJSX({ nodes: node.children })
              if ('listType' in parent && parent.listType === 'number') {
                return (
                  <li
                    className={cn(hasSubLists && 'nestedListItem')}
                    style={hasSubLists ? { listStyleType: 'none' } : undefined}
                    value={node.value}
                  >
                    {children}
                  </li>
                )
              }
              return (
                <li
                  className={cn('flex gap-4 items-start', hasSubLists && 'nestedListItem')}
                  style={hasSubLists ? { listStyleType: 'none' } : undefined}
                  value={node.value}
                >
                  <span className={ulMarkerClassName} aria-hidden />
                  <div className="min-w-0 flex-1">{children}</div>
                </li>
              )
            },
            blocks: {
              ...defaultConverters.blocks,
              code: ({ node }: { node: { fields?: { code?: string; language?: string } } }) => {
                const { code, language } = node.fields ?? {}
                // Plain code blocks created in the admin sometimes get the literal word
                // "undefined" prepended (upstream Lexical code-block converter bug). Strip it.
                const isPlain = !language || language === 'plain'
                let safeCode = code ?? ''
                if (isPlain && safeCode.startsWith('undefined')) {
                  safeCode = safeCode.slice('undefined'.length)
                }
                return <HighlightedCodeBlock code={safeCode} language={language} />
              },
            },
          })}
        />
      </div>
    </ErrorBoundary>
  )
}
