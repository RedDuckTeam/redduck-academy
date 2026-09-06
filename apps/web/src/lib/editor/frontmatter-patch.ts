import { isMap, isNode, isScalar, parseDocument, stringify } from 'yaml'
import { FRONTMATTER_RE } from '@/lib/content/frontmatter'
import type { Pair, ParsedNode } from 'yaml'

/**
 * Frontmatter is edited through a form and written back by splicing single spans of the YAML text,
 * never by re-emitting the block. Several lessons carry `faq:` answers folded across lines
 * (`content/blockchain-basics/cryptography/hashing.md`), which any round-trip through a writer
 * would reflow into a diff touching every one of them; comments and key order would go the same way.
 * `parseDocument` is used purely to locate nodes — the source offsets on the parsed nodes are what
 * the edits are applied to.
 */

/** The lesson keys the form owns. `id` is read-only here and `faq` is left entirely to the file. */
export interface LessonFrontmatter {
  id: string | number | null
  title: string
  type: string
  order: number | null
  isHidden: boolean
}

/** `id` is deliberately not expressible: it must never be authored or altered from the editor. */
export interface FrontmatterPatch {
  title?: string
  type?: string
  order?: number
  isHidden?: boolean
}

/**
 * Where a key the form *adds* is inserted. Keys already in the file keep the position they have:
 * nothing in CI checks key order, so reordering would produce a diff on files already on `main`.
 */
const KEY_ORDER = ['id', 'title', 'type', 'order', 'isHidden', 'faq']

interface Located {
  /** Offset of the YAML text within the file. */
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
    id: typeof row.id === 'string' || typeof row.id === 'number' ? row.id : null,
    title: typeof row.title === 'string' ? row.title : '',
    type: typeof row.type === 'string' ? row.type : '',
    order: typeof row.order === 'number' ? row.order : null,
    isHidden: row.isHidden === true,
  }
}

export function patchFrontmatter(source: string, patch: FrontmatterPatch): string {
  // One key at a time, re-parsing between each, so a second insertion sees the offsets the first
  // one produced. The blocks are a few hundred bytes; correctness is worth more than the passes.
  return KEY_ORDER.reduce((current, key) => {
    if (!(key in patch)) return current
    const value = patch[key as keyof FrontmatterPatch]
    return value === undefined ? current : setKey(current, key, value)
  }, source)
}

function setKey(source: string, key: string, value: string | number | boolean): string {
  const located = locate(source)
  if (!located) return source

  const contents = parseDocument(located.yaml).contents
  if (!isMap(contents)) return source

  const items = contents.items as Array<Pair<ParsedNode, ParsedNode | null>>
  const edit = editFor(items, located.yaml, key, value)
  if (!edit) return source

  const yaml = located.yaml.slice(0, edit.from) + edit.insert + located.yaml.slice(edit.to)
  return source.slice(0, located.start) + yaml + source.slice(located.start + located.yaml.length)
}

function editFor(
  items: Array<Pair<ParsedNode, ParsedNode | null>>,
  yaml: string,
  key: string,
  value: string | number | boolean,
): Edit | null {
  const index = items.findIndex((pair) => isScalar(pair.key) && pair.key.value === key)

  // `isHidden: false` and an absent `isHidden` mean the same thing to every reader of these files,
  // so the falsy state is the absent one. Otherwise toggling a switch twice would leave a line behind.
  if (value === false) return index === -1 ? null : removalEdit(items, yaml, index)

  const literal = scalarSource(value)
  if (index !== -1) return replacementEdit(items[index], yaml, literal)

  const rank = KEY_ORDER.indexOf(key)
  const successor = items.find((pair) => {
    if (!isScalar(pair.key)) return false
    const other = KEY_ORDER.indexOf(String(pair.key.value))
    return other > rank
  })

  if (successor && isScalar(successor.key) && successor.key.range) {
    const lineStart = yaml.lastIndexOf('\n', successor.key.range[0] - 1) + 1
    return { from: lineStart, to: lineStart, insert: `${key}: ${literal}\n` }
  }
  return {
    from: yaml.length,
    to: yaml.length,
    insert: yaml.length === 0 ? `${key}: ${literal}` : `\n${key}: ${literal}`,
  }
}

function replacementEdit(pair: Pair<ParsedNode, ParsedNode | null>, yaml: string, literal: string): Edit | null {
  const range = isNode(pair.value) ? pair.value.range : null
  if (!range) return null

  // `title:` parses to an empty value node sitting immediately after the colon, so the separating
  // space has to come from the edit or the key and the value run together.
  const separator = range[0] === range[1] && yaml[range[0] - 1] === ':' ? ' ' : ''
  return { from: range[0], to: range[1], insert: `${separator}${literal}` }
}

function removalEdit(items: Array<Pair<ParsedNode, ParsedNode | null>>, yaml: string, index: number): Edit | null {
  const key = items[index].key
  if (!isScalar(key) || !key.range) return null

  const lineStart = yaml.lastIndexOf('\n', key.range[0] - 1) + 1
  const next = items[index + 1]?.key
  if (isScalar(next) && next.range) {
    return { from: lineStart, to: yaml.lastIndexOf('\n', next.range[0] - 1) + 1, insert: '' }
  }

  // Last pair: take the newline that preceded it too, or the block closes on a blank line.
  const preceding = /\r?\n$/.exec(yaml.slice(0, lineStart))
  return { from: lineStart - (preceding?.[0].length ?? 0), to: yaml.length, insert: '' }
}

/** Let the YAML writer decide quoting; `lineWidth: 0` stops it folding a long title across lines. */
function scalarSource(value: string | number | boolean): string {
  return stringify(value, { lineWidth: 0 }).replace(/\n$/, '')
}
