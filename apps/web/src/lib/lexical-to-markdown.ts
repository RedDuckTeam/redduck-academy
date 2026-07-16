/**
 * Serialises Payload/Lexical rich-text `content` to Markdown for the lesson
 * `.md` endpoints that AI agents and LLM tools fetch.
 *
 * Diagrams are stored as inline `<svg>` markup with an authored `<title>` and
 * `<desc>`. Markdown has no SVG, so we render each diagram as its title +
 * description — the meaning survives, the noise doesn't.
 *
 * A sibling serializer lives in scripts/dump-content.mjs (the content dumper); the two
 * cover the same Lexical nodes and must stay in sync when either changes.
 */

import type { LessonFaqItem } from '@/types/lesson'

interface LexNode {
  type?: string
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  fields?: { url?: string; blockType?: string; language?: string; code?: string }
  children?: LexNode[]
}

const TEXT_BOLD = 1
const TEXT_ITALIC = 2
const TEXT_CODE = 16

/** Apply inline formatting flags (Lexical packs them into a bitmask). */
function formatText(node: LexNode): string {
  let t = node.text ?? ''
  if (!t) return t
  const f = typeof node.format === 'number' ? node.format : 0
  if (f & TEXT_CODE) t = `\`${t}\``
  if (f & TEXT_BOLD) t = `**${t}**`
  if (f & TEXT_ITALIC) t = `*${t}*`
  return t
}

/** Concatenate child text without formatting — used to reassemble raw <svg> markup. */
function rawText(children: LexNode[] = []): string {
  return children
    .map((n) => (n.type === 'text' ? (n.text ?? '') : n.type === 'linebreak' ? '\n' : n.children ? rawText(n.children) : (n.text ?? '')))
    .join('')
}

function inline(children: LexNode[] = []): string {
  return children
    .map((n) => {
      switch (n.type) {
        case 'text':
          return formatText(n)
        case 'linebreak':
          return '\n'
        case 'link':
        case 'autolink':
          return `[${inline(n.children)}](${n.fields?.url ?? ''})`
        default:
          return n.children ? inline(n.children) : (n.text ?? '')
      }
    })
    .join('')
}

function listToMarkdown(node: LexNode, depth = 0): string {
  const ordered = node.listType === 'number'
  const pad = '  '.repeat(depth)
  const lines: string[] = []
  let index = 1
  for (const item of node.children ?? []) {
    if (item.type !== 'listitem') continue
    const nested = (item.children ?? []).filter((c) => c.type === 'list')
    const own = (item.children ?? []).filter((c) => c.type !== 'list')
    const marker = ordered ? `${index}.` : '-'
    if (own.length || !nested.length) {
      lines.push(`${pad}${marker} ${inline(own)}`.trimEnd())
      index++
    }
    for (const sub of nested) lines.push(listToMarkdown(sub, depth + 1))
  }
  return lines.join('\n')
}

function tableToMarkdown(node: LexNode): string {
  const rows = (node.children ?? []).filter((r) => r.type === 'tablerow')
  const out: string[] = []
  rows.forEach((row, idx) => {
    const cells = (row.children ?? [])
      .filter((c) => c.type === 'tablecell')
      .map((c) => inline((c.children ?? []).flatMap((p) => p.children ?? [])).replace(/\n/g, ' ').trim())
    out.push(`| ${cells.join(' | ')} |`)
    if (idx === 0) out.push(`| ${cells.map(() => '---').join(' | ')} |`)
  })
  return out.join('\n')
}

function codeToMarkdown(node: LexNode): string {
  const lang = node.fields?.language && node.fields.language !== 'plain' ? node.fields.language : ''
  return '```' + lang + '\n' + (node.fields?.code ?? '') + '\n```'
}

const decodeEntities = (s: string): string => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/** Render an inline SVG diagram as its authored title + description. */
function diagramToMarkdown(svg: string): string {
  const title = svg.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  const desc = svg.match(/<desc>([\s\S]*?)<\/desc>/i)?.[1]?.trim()
  const label = title ? decodeEntities(title) : 'Diagram'
  const body = desc ? decodeEntities(desc) : ''
  return body ? `**[Diagram] ${label}**\n\n${body}` : `**[Diagram] ${label}**`
}

/** A paragraph that is a single embed link (playground/video) → a clean labelled link. */
function embedLink(paragraph: LexNode): string | null {
  const first = paragraph.children?.[0]
  if (!first || (first.type !== 'autolink' && first.type !== 'link')) return null
  const url = first.fields?.url
  if (!url) return null
  if (url.includes('plgrnd.io')) return `[Interactive playground](${url})`
  if (url.includes('eth.build')) return `[Interactive: eth.build](${url})`
  if (url.includes('youtube.com') || url.includes('youtu.be')) return `[Watch on YouTube](${url})`
  return null
}

const headingLevel = (tag?: string): number => Number(tag?.replace('h', '')) || 2

function blockToMarkdown(root: LexNode): string {
  const kids = root.children ?? []
  const parts: string[] = []
  for (let i = 0; i < kids.length; i++) {
    const child = kids[i]
    switch (child.type) {
      case 'heading':
        parts.push(`${'#'.repeat(headingLevel(child.tag))} ${inline(child.children)}`)
        break
      case 'paragraph': {
        const raw = rawText(child.children)
        if (raw.trimStart().startsWith('<svg')) {
          // Diagrams span several paragraph nodes; buffer until the closing tag.
          let svg = raw
          while (!/<\/svg>/.test(svg) && i + 1 < kids.length) svg += rawText(kids[++i].children)
          parts.push(diagramToMarkdown(svg))
          break
        }
        const embed = embedLink(child)
        if (embed) {
          parts.push(embed)
          break
        }
        const text = inline(child.children).trim()
        if (text) parts.push(text)
        break
      }
      case 'quote':
        parts.push(
          inline(child.children)
            .split('\n')
            .map((l) => `> ${l}`)
            .join('\n'),
        )
        break
      case 'list':
        parts.push(listToMarkdown(child))
        break
      case 'table':
        parts.push(tableToMarkdown(child))
        break
      case 'block':
        if (child.fields?.blockType === 'code') parts.push(codeToMarkdown(child))
        break
      default:
        if (child.children) parts.push(blockToMarkdown(child))
    }
  }
  return parts.join('\n\n')
}

/** Serialise Lexical `content` (the shape stored in `lesson.content`) to Markdown. */
export function lexicalToMarkdown(content: unknown): string {
  const root = (content as { root?: LexNode } | null)?.root
  if (!root) return ''
  return blockToMarkdown(root)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function faqToMarkdown(faq?: LessonFaqItem[] | null): string {
  const rows = (faq ?? []).filter((f) => f.question?.trim() && f.answer?.trim())
  if (rows.length === 0) return ''
  return '\n\n## FAQ\n\n' + rows.map((f) => `### ${f.question.trim()}\n\n${f.answer.trim()}`).join('\n\n')
}

/**
 * A full, self-attributing Markdown document for one lesson: title, a `Source:` line
 * with the canonical URL (so an LLM that ingests it can cite us), the body (already
 * Markdown, from the `content/` files), and — when authored — a FAQ section
 * (Markdown-only; not on the HTML page).
 */
export function lessonMarkdownDoc(
  title: string,
  sourceUrl: string,
  bodyMarkdown: string,
  faq?: LessonFaqItem[] | null,
): string {
  return `# ${title}\n\nSource: ${sourceUrl}\n\n${bodyMarkdown.trim()}${faqToMarkdown(faq)}\n`
}
