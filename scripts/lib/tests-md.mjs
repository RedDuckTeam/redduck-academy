// Shared helpers for test-question Markdown: the parser (used by the validator and the DB sync)
// and the Markdown -> Lexical richText converter (used by the sync). Kept dependency-free so the
// scripts stay lightweight — no Payload runtime. The Lexical shapes below mirror exactly what the
// admin editor produces (verified against the DB), so the frontend's Payload React renderer draws
// them identically.
import { randomBytes } from 'node:crypto'

// `<!-- q -->` (id assigned later by the sync) or `<!-- q:ID -->`.
export const Q_MARKER_RE = /^<!--\s*q(?::\s*([^\s>]+))?\s*-->$/
// A trailing `<!-- a:ID -->` on an option line (optional; the sync assigns missing ids).
const OPTION_ID_RE = /\s*<!--\s*a:\s*([^\s>]+)\s*-->\s*$/
const OPTION_LINE_RE = /^- \[([ xX])\]\s+(.*)$/
export const TEST_ID_RE = /^[A-Za-z0-9_-]{6,}$/
export const MULTI_CUE_RE = /select all|choose all|all that apply|select every|select each/i

/** A fresh 24-char hex id, matching the format Payload generates for array rows. */
export function makeId() {
  return randomBytes(12).toString('hex')
}

/**
 * Parse the questions section of a test-lesson body. Everything before the first `<!-- q -->`
 * marker is the intro. A stem may contain fenced code, so option parsing is fence-aware. Question
 * and option ids are optional in the source (a marker starts a new question and resets fence state,
 * so an unbalanced ``` fence can't swallow later questions). Body-relative line indices are recorded
 * (`markerLine`, `line`) so the sync can splice generated ids back into the exact source lines.
 * Returns { questions: [{ id|null, markerLine, stem, options: [{ id|null, line, label, correct }] }],
 * parseErrors }.
 */
export function parseTestQuestions(body) {
  const parseErrors = []
  const lines = body.split('\n')
  const start = lines.findIndex((l) => Q_MARKER_RE.test(l.trim()))
  if (start === -1) return { questions: [], parseErrors }

  const questions = []
  let cur = null
  let inFence = false
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const marker = trimmed.match(Q_MARKER_RE)
    if (marker) {
      if (cur) questions.push(cur)
      cur = { id: marker[1] ?? null, markerLine: i, stemLines: [], options: [] }
      inFence = false
      continue
    }
    if (!cur) continue
    if (/^```/.test(trimmed)) inFence = !inFence
    if (!inFence) {
      const opt = OPTION_LINE_RE.exec(line)
      if (opt) {
        let rest = opt[2]
        let id = null
        const idMatch = rest.match(OPTION_ID_RE)
        if (idMatch) {
          id = idMatch[1]
          rest = rest.slice(0, idMatch.index)
        }
        cur.options.push({ correct: opt[1].toLowerCase() === 'x', label: rest.trim(), id, line: i })
        continue
      }
      if (/^- \[[ xX]?\]/.test(trimmed)) {
        parseErrors.push(`question ${cur.id ?? '(no id)'}: malformed option line: ${trimmed.slice(0, 70)}`)
        continue
      }
    }
    if (cur.options.length === 0) cur.stemLines.push(line)
  }
  if (cur) questions.push(cur)
  for (const q of questions) q.stem = q.stemLines.join('\n').trim()
  return { questions, parseErrors }
}

/**
 * Key-order-independent signature of a richText value, for change detection. Postgres jsonb doesn't
 * preserve key order, so a plain JSON.stringify would report false changes. The internal code-block
 * node id (fields.id, recognized by its sibling blockType key) is blanked — it's referenced nowhere
 * and would otherwise churn on every sync.
 */
export function richTextSig(node) {
  if (Array.isArray(node)) return '[' + node.map(richTextSig).join(',') + ']'
  if (node && typeof node === 'object') {
    return (
      '{' +
      Object.keys(node)
        .sort()
        .map((k) => `${JSON.stringify(k)}:${k === 'id' && node.blockType !== undefined ? '"ID"' : richTextSig(node[k])}`)
        .join(',') +
      '}'
    )
  }
  return JSON.stringify(node)
}

// ---- Markdown -> Lexical richText ----

function textNode(text, format) {
  return { mode: 'normal', text, type: 'text', style: '', detail: 0, format, version: 1 }
}
function paragraphNode(children) {
  return { type: 'paragraph', format: '', indent: 0, version: 1, children, direction: null, textStyle: '', textFormat: 0 }
}
function codeBlockNode(code, language) {
  return { type: 'block', fields: { id: makeId(), code, language: language || 'plain', blockName: '', blockType: 'code' }, format: '', version: 2 }
}

// Inline formatting present in the corpus: bold (**), italic (* or _), inline code (`). Non-nested,
// which matches every question/option authored to date. Format bits: 1 bold, 2 italic, 16 code.
const INLINE_RE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/g
function parseInline(text) {
  const nodes = []
  let last = 0
  let m
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(textNode(text.slice(last, m.index), 0))
    if (m[1]) nodes.push(textNode(m[1].slice(1, -1), 16))
    else if (m[2]) nodes.push(textNode(m[2].slice(2, -2), 1))
    else if (m[3]) nodes.push(textNode(m[3].slice(1, -1), 2))
    else nodes.push(textNode(m[4].slice(1, -1), 2))
    last = INLINE_RE.lastIndex
  }
  INLINE_RE.lastIndex = 0
  if (last < text.length) nodes.push(textNode(text.slice(last), 0))
  return nodes.length ? nodes : [textNode('', 0)]
}

function splitBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let para = []
  const flush = () => {
    if (para.length) blocks.push({ type: 'para', lines: para })
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^```(\w*)\s*$/)
    if (open) {
      flush()
      const code = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', lang: open[1] || 'plain', code: code.join('\n') })
      continue
    }
    if (lines[i].trim() === '') {
      flush()
      continue
    }
    para.push(lines[i])
  }
  flush()
  return blocks
}

/** Convert a Markdown stem or option label to the Lexical richText the DB stores. */
export function mdToLexical(markdown) {
  const children = []
  for (const b of splitBlocks(markdown)) {
    if (b.type === 'code') {
      children.push(codeBlockNode(b.code, b.lang))
      continue
    }
    const inline = []
    b.lines.forEach((ln, idx) => {
      if (idx > 0) inline.push({ type: 'linebreak', version: 1 })
      inline.push(...parseInline(ln))
    })
    children.push(paragraphNode(inline))
  }
  if (children.length === 0) children.push(paragraphNode([textNode('', 0)]))
  return { root: { type: 'root', format: '', indent: 0, version: 1, children, direction: null } }
}
