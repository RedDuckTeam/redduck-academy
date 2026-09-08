import { isMap, isNode, isScalar, parseDocument, stringify } from 'yaml'
import { FRONTMATTER_RE } from '@/lib/content/frontmatter'
import type { Pair, ParsedNode } from 'yaml'

// Splices YAML spans, never re-emits the block: re-emitting reflows the folded `faq:` answers into a diff on every file.

export interface LessonFrontmatter {
  title: string
  type: string
}

const KEY_ORDER = ['id', 'title', 'type', 'order', 'isHidden', 'faq']

interface Located {
  start: number
  yaml: string
}

interface Edit {
  from: number
  to: number
  insert: string
}

function locate(source: string): Located | null {
  const block = source.match(FRONTMATTER_RE)?.[0]
  if (block === undefined) return null
  const open = /^---\r?\n/.exec(block)?.[0].length ?? 0
  const close = /\r?\n---\r?\n?$/.exec(block)?.[0].length ?? 0
  return { start: open, yaml: block.slice(open, block.length - close) }
}

export function readFrontmatter(source: string): LessonFrontmatter | null {
  const located = locate(source)
  if (!located) return null

  let data: unknown
  try {
    data = parseDocument(located.yaml).toJS()
  } catch {
    return null
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return null

  const row = data as Record<string, unknown>
  return {
    title: typeof row.title === 'string' ? row.title : '',
    type: typeof row.type === 'string' ? row.type : '',
  }
}

export function setTitle(source: string, title: string): string {
  const located = locate(source)
  if (!located) return source

  const contents = parseDocument(located.yaml).contents
  if (!isMap(contents)) return source

  const items = contents.items as Array<Pair<ParsedNode, ParsedNode | null>>
  const edit = titleEdit(items, located.yaml, scalarSource(title))
  if (!edit) return source

  const yaml = located.yaml.slice(0, edit.from) + edit.insert + located.yaml.slice(edit.to)
  return source.slice(0, located.start) + yaml + source.slice(located.start + located.yaml.length)
}

function titleEdit(items: Array<Pair<ParsedNode, ParsedNode | null>>, yaml: string, literal: string): Edit | null {
  const existing = items.find((pair) => isScalar(pair.key) && pair.key.value === 'title')
  if (existing) return replacementEdit(existing, yaml, literal)

  const rank = KEY_ORDER.indexOf('title')
  const successor = items.find((pair) => {
    if (!isScalar(pair.key)) return false
    const other = KEY_ORDER.indexOf(String(pair.key.value))
    return other > rank
  })

  if (successor && isScalar(successor.key) && successor.key.range) {
    const lineStart = yaml.lastIndexOf('\n', successor.key.range[0] - 1) + 1
    return { from: lineStart, to: lineStart, insert: `title: ${literal}\n` }
  }
  return {
    from: yaml.length,
    to: yaml.length,
    insert: yaml.length === 0 ? `title: ${literal}` : `\ntitle: ${literal}`,
  }
}

function replacementEdit(pair: Pair<ParsedNode, ParsedNode | null>, yaml: string, literal: string): Edit | null {
  const range = isNode(pair.value) ? pair.value.range : null
  if (!range) return null

  // `title:` parses to an empty value node right after the colon, so the separating space must come from the edit.
  const separator = range[0] === range[1] && yaml[range[0] - 1] === ':' ? ' ' : ''
  // A block scalar's range runs to the next key, newline included; replacing that newline glues the next key on.
  const trailing = /\r?\n$/.exec(yaml.slice(range[0], range[1]))?.[0].length ?? 0
  return { from: range[0], to: range[1] - trailing, insert: `${separator}${literal}` }
}

function scalarSource(value: string): string {
  return stringify(value, { lineWidth: 0 }).replace(/\n$/, '')
}
