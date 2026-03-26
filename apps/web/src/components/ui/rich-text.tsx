import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

interface CustomRichTextProps {
  data?: Record<string, any> | null
  className?: string
}

const blockquoteStyles =
  '[&_blockquote]:text [&_blockquote]:pl-2.5 [&_blockquote]:border-l [&_blockquote]:border-border'
const anchorStyles = '[&_a]:text-primary [&_a]:underline'

const codeStyles =
  '[&_code]:bg-border/40 [&_code]:border [&_code]:border-border [&_code]:rounded-[2px] [&_code]:px-[3px] [&_code]:py-[2px]'
export function RichText({ data, className }: CustomRichTextProps) {
  if (!data) return null

  return (
    <div className={cn(blockquoteStyles, anchorStyles, codeStyles, className)}>
      <PayloadRichText
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
              <Text variant={variant} element={element} className="">
                {nodesToJSX({ nodes: node.children })}
              </Text>
            )
          },
          paragraph: ({ node, nodesToJSX }) => {
            return (
              <Text variant="main-18" className="">
                {nodesToJSX({ nodes: node.children })}
              </Text>
            )
          },
          blocks: {
            ...defaultConverters.blocks,
            code: ({ node }: { node: { fields?: { code?: string; language?: string } } }) => {
              const { code, language } = node.fields ?? {}
              return (
                <div className="relative my-6 overflow-hidden rounded-xl border border-border bg-muted shadow-lg dark:border-white/10 dark:bg-[#1e1e1e]">
                  <div className="flex items-center border-b border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground dark:border-white/10 dark:bg-[#2d2d2d] dark:text-white/50">
                    {language || 'code'}
                  </div>
                  <pre
                    className="overflow-x-auto p-4 font-mono text-[14px] leading-relaxed text-foreground dark:text-[#d4d4d4]"
                    data-language={language}
                  >
                    <code lang={language}>{code ?? ''}</code>
                  </pre>
                </div>
              )
            },
          },
        })}
      />
    </div>
  )
}
