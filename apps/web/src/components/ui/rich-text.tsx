import { RichText as PayloadRichText, ListJSXConverter } from '@payloadcms/richtext-lexical/react'
import { Link } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { HighlightedCodeBlock } from '@/components/ui/highlighted-code-block'

type EnrichedLessonDoc = {
  href?: string
  navigation?: { courseSlug: string; moduleSlug: string; lessonSlug: string }
}

interface CustomRichTextProps {
  data?: Record<string, any> | null
  className?: string
  paragraphClassName?: string
}

const blockquoteStyles =
  '[&_blockquote]:text [&_blockquote]:pl-2.5 [&_blockquote]:border-l [&_blockquote]:border-border'
const anchorStyles = '[&_a]:text-primary [&_a]:underline'

const codeStyles =
  '[&_p_code]:bg-border/40 [&_p_code]:text-primary [&_p_code]:border [&_p_code]:border-border [&_p_code]:rounded-[2px] [&_p_code]:px-[3px] [&_p_code]:py-[2px]'

const ulMarkerClassName = 'mt-[0.45em] h-2.5 w-2.5 shrink-0 bg-black dark:bg-white'

function getEthBuildUrl(text: string): string | null {
  const trimmed = text.trim()
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'sandbox.eth.build' || url.hostname === 'eth.build') {
      return trimmed
    }
    return null
  } catch {
    return null
  }
}

function getYoutubeEmbedUrl(text: string): string | null {
  const trimmed = text.trim()
  try {
    const url = new URL(trimmed)
    let videoId: string | null = null
    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.slice(1).split('?')[0]
    } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
      videoId = url.searchParams.get('v')
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } catch {
    return null
  }
}

export function RichText({ data, className, paragraphClassName }: CustomRichTextProps) {
  if (!data) return null

  return (
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
            return (
              <Text variant={variant} element={element} className="mb-3! font-medium">
                {nodesToJSX({ nodes: node.children })}
              </Text>
            )
          },
          paragraph: ({ node, nodesToJSX }) => {
            const textNode = node.children[0] as unknown as { type?: 'autolink'; fields?: { url?: string } }
            if (
              textNode?.type === 'autolink' &&
              (textNode.fields?.url?.includes('youtube.com') || textNode.fields?.url?.includes('youtu.be'))
            ) {
              const embedUrl = getYoutubeEmbedUrl(textNode.fields?.url ?? '')
              if (embedUrl) {
                return (
                  <div className="aspect-video w-full overflow-hidden rounded-xl my-4">
                    <iframe
                      src={embedUrl}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                )
              }
            }
            if (
              textNode?.type === 'autolink' &&
              (textNode.fields?.url?.includes('sandbox.eth.build') || textNode.fields?.url?.includes('eth.build'))
            ) {
              const ethBuildUrl = getEthBuildUrl(textNode.fields?.url ?? '')
              if (ethBuildUrl) {
                return (
                  <div className="aspect-[9/13] md:aspect-video w-full overflow-hidden rounded-xl my-4">
                    <iframe
                      src={ethBuildUrl}
                      title="eth.build interactive flow"
                      sandbox="allow-scripts allow-same-origin"
                      referrerPolicy="no-referrer"
                      className="h-full w-full"
                    />
                  </div>
                )
              }
            }
            return (
              <Text variant="main-18" className={paragraphClassName}>
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
            const rel = node.fields.newTab ? 'noopener noreferrer' : undefined
            const target = node.fields.newTab ? '_blank' : undefined
            const doc = node.fields.doc as EnrichedLessonDoc | null | undefined

            if (node.fields.linkType === 'internal' && doc?.navigation) {
              const href =
                doc.href ??
                `/courses/${doc.navigation.courseSlug}/${doc.navigation.moduleSlug}/${doc.navigation.lessonSlug}`
              if (node.fields.newTab) {
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

            let href = node.fields.url ?? ''
            if (node.fields.linkType === 'internal') {
              href = typeof doc?.href === 'string' ? doc.href : '#'
            }
            return (
              <a href={href} rel={rel} target={target} className="text-primary underline">
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
              return <HighlightedCodeBlock code={code ?? ''} language={language} />
            },
          },
        })}
      />
    </div>
  )
}
