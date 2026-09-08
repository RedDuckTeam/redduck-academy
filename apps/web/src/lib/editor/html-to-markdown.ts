// Hand-rolled rather than a converter package: the paste path takes on no dependency, and every
// rule that decides what a contributor ends up staring at is here to be read and pinned by a test.

const HEADINGS: Record<string, number> = { H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6 }

const BLOCK_TAGS = new Set(['P', 'DIV', 'UL', 'OL', 'LI', 'DL', 'DT', 'DD', 'BLOCKQUOTE', 'PRE', 'TABLE', 'HR'])

const INLINE_ONLY = new Set(['A', 'CODE', 'KBD', 'SAMP', 'BR', 'IMG'])

const IGNORED = new Set(['SCRIPT', 'STYLE', 'HEAD', 'META', 'LINK', 'NOSCRIPT'])

/**
 * Kept verbatim: an SVG element's `tagName` is lowercase in the SVG namespace, so it matches none
 * of the sets above and would otherwise take the inline path and lose everything but its text.
 */
const RAW_TAGS = new Set(['svg'])

export function htmlToMarkdown(html: string): string {
  // DOMParser builds a detached document: nothing here is ever attached to the live page, and the
  // result is text, so no markup from the clipboard can execute.
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  return childBlocks(parsed.body)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function childBlocks(parent: Node): string[] {
  const blocks: string[] = []
  let inlineRun = ''

  const flush = () => {
    const text = inlineRun.replace(/[ \t]+/g, ' ').trim()
    if (text) blocks.push(text.split('\n').map(escapeLineStart).join('\n'))
    inlineRun = ''
  }

  for (const child of Array.from(parent.childNodes)) {
    if (isBlock(child)) {
      flush()
      const block = convertBlock(child as HTMLElement)
      if (block) blocks.push(block)
    } else {
      inlineRun += convertInline(child)
    }
  }
  flush()
  return blocks
}

function isBlock(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false
  const { tagName } = node as Element
  if (tagName in HEADINGS || BLOCK_TAGS.has(tagName) || RAW_TAGS.has(tagName)) return true
  if (INLINE_ONLY.has(tagName)) return false
  // Google Docs wraps its whole clipboard payload in `<b style="font-weight:normal">` and marks
  // runs with inline styles instead; anything holding a block is a block, whatever its tag says.
  return Array.from(node.childNodes).some(isBlock)
}

function convertBlock(element: HTMLElement): string {
  const tag = element.tagName
  if (IGNORED.has(tag)) return ''
  if (RAW_TAGS.has(tag)) return element.outerHTML

  const level = HEADINGS[tag]
  if (level) {
    // Google Docs marks a whole heading `font-weight:700`; `## **Title**` is noise, not emphasis.
    const text = convertInline(element)
      .trim()
      .replace(/^\*\*([\s\S]*)\*\*$/, '$1')
    return text ? `${'#'.repeat(level)} ${text}` : ''
  }

  switch (tag) {
    case 'HR':
      return '---'
    case 'PRE':
      return fencedCode(element)
    case 'UL':
    case 'OL':
      return listItems(element)
    case 'DT':
      // Markdown has no definition list. Bolding the term is the least the conversion can do to
      // keep it from running into its definition, which is most of what a `<dl>` was saying.
      return wrap(childBlocks(element).join(' '), '**')
    case 'BLOCKQUOTE':
      return childBlocks(element)
        .join('\n\n')
        .split('\n')
        .map((line) => `> ${line}`.trimEnd())
        .join('\n')
    case 'TABLE':
      return table(element)
    default:
      return childBlocks(element).join('\n\n')
  }
}

function fencedCode(element: HTMLElement): string {
  const code = element.textContent?.replace(/\n+$/, '') ?? ''
  if (!code) return ''
  // A fence longer than any run inside the snippet, so a pasted Markdown sample cannot break out.
  const longest = Math.max(2, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length))
  const fence = '`'.repeat(longest + 1)
  const language = /language-([\w+-]+)/.exec(element.querySelector('code')?.className ?? '')?.[1] ?? ''
  return `${fence}${language}\n${code}\n${fence}`
}

function listItems(list: HTMLElement): string {
  const ordered = list.tagName === 'OL'
  // A list continuing an earlier one carries `start`; renumbering from 1 would silently renumber
  // the steps of a procedure the contributor pasted.
  const start = ordered ? Number(list.getAttribute('start')) || 1 : 1
  const lines: string[] = []

  for (const item of Array.from(list.children)) {
    if (item.tagName !== 'LI') continue
    const body = childBlocks(item).join('\n\n')
    if (!body.trim()) continue

    const bullet = ordered ? `${start + lines.length}. ` : '- '
    const pad = ' '.repeat(bullet.length)
    const [first = '', ...rest] = body.split('\n')
    lines.push([`${bullet}${first}`, ...rest.map((line) => (line ? `${pad}${line}` : line))].join('\n'))
  }

  return lines.join('\n')
}

function table(element: HTMLElement): string {
  const rows = Array.from(element.querySelectorAll('tr')).map((row) =>
    Array.from(row.children).map((cell) => convertInline(cell).replace(/\|/g, '\\|').trim()),
  )
  if (rows.length === 0) return ''

  const width = Math.max(...rows.map((row) => row.length))
  const pad = (row: string[]) => `| ${Array.from({ length: width }, (_, index) => row[index] ?? '').join(' | ')} |`
  const [header, ...body] = rows
  return [pad(header), `| ${Array.from({ length: width }, () => '---').join(' | ')} |`, ...body.map(pad)].join('\n')
}

function convertInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    // HTML collapses whitespace runs; keeping them would show up as stray gaps in the buffer.
    return escapeText((node.nodeValue ?? '').replace(/\s+/g, ' '))
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const element = node as HTMLElement
  const tag = element.tagName
  if (IGNORED.has(tag)) return ''
  if (RAW_TAGS.has(tag)) return element.outerHTML
  // CommonMark folds a lone newline into a space. Backslash rather than two trailing spaces,
  // which `flush()` would collapse.
  if (tag === 'BR') return '\\\n'
  if (tag === 'IMG') {
    const source = element.getAttribute('src') ?? ''
    return source ? `![${element.getAttribute('alt') ?? ''}](${source})` : ''
  }

  const inner = Array.from(element.childNodes).map(convertInline).join('')

  if (tag === 'A') {
    const href = element.getAttribute('href') ?? ''
    return href && inner.trim() ? `[${inner.trim()}](${href})` : inner
  }
  if (tag === 'CODE' || tag === 'KBD' || tag === 'SAMP') return codeSpan(element)

  // Reading the inline style back is what makes a Google Docs paste arrive with its emphasis
  // intact: it marks bold and italic runs with `<span style>`, never with <strong>/<em>.
  return wrap(wrap(inner, isBold(element) ? '**' : ''), isItalic(element) ? '*' : '')
}

function codeSpan(element: HTMLElement): string {
  // Deliberately not the escaped inner text: a backslash inside a code span is a backslash.
  const code = (element.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!code) return ''
  const longest = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length))
  const fence = '`'.repeat(longest + 1)
  // A span whose own text touches a backtick needs padding spaces, which the renderer strips back.
  const padding = code.startsWith('`') || code.endsWith('`') ? ' ' : ''
  return `${fence}${padding}${code}${padding}${fence}`
}

/**
 * What arrives on the clipboard is prose that happens to be spelled with characters Markdown reads
 * as syntax, so a sentence mentioning `*` or `[1]` has to be handed back the characters it came
 * with. Only text nodes go through here — never the markup this file emits, and never a code span.
 */
function escapeText(text: string): string {
  return text.replace(/[\\`*[\]<_]/g, (character, index: number) => {
    // Escaping every `snake_case` identifier a lesson mentions would read worse than the problem,
    // and CommonMark does not treat an intraword underscore as emphasis anyway.
    if (character === '_') {
      return /\w/.test(text[index - 1] ?? '') && /\w/.test(text[index + 1] ?? '') ? character : '\\_'
    }
    // `<` only opens markup when something tag-shaped follows it; `5 < 6` is left alone.
    if (character === '<') return /[a-zA-Z!/?]/.test(text[index + 1] ?? '') ? '\\<' : character
    return `\\${character}`
  })
}

/** Markdown's block syntax only bites at the start of a line, so a pasted "# " is defused there. */
function escapeLineStart(line: string): string {
  return (
    line
      .replace(/^(#{1,6}(?=\s|$)|[-+](?=\s|$)|>)/, '\\$1')
      // `\1.` would be a literal backslash, so an ordered list loses its delimiter instead.
      .replace(/^(\d{1,9})([.)](?=\s))/, '$1\\$2')
  )
}

/** Applies `symbol` around the text but outside its surrounding spaces — ` **x** `, never `** x **`. */
function wrap(text: string, symbol: string): string {
  if (!symbol || !text.trim()) return text
  const [, leading = '', core = '', trailing = ''] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text) ?? []
  return `${leading}${symbol}${core}${symbol}${trailing}`
}

function isBold(element: HTMLElement): boolean {
  const weight = element.style.fontWeight
  if (weight) return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600
  return element.tagName === 'STRONG' || element.tagName === 'B'
}

function isItalic(element: HTMLElement): boolean {
  const style = element.style.fontStyle
  if (style) return style === 'italic' || style === 'oblique'
  return element.tagName === 'EM' || element.tagName === 'I'
}
