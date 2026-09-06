import { parse as parseYaml } from 'yaml'

/**
 * The rules a proposal must satisfy *before* anything is written to the repository.
 *
 * This is deliberately not a reimplementation of `scripts/validate-content.mjs`. That script runs
 * as `content-verify.yml` on every push to a `proposal/**` branch and stays the authority for the
 * full rule set — allowed keys, numeric `order`, `<svg>` balance, the question grammar,
 * corpus-wide id uniqueness. Duplicating it here would mean two implementations drifting apart,
 * with the copy that never sees the whole tree pretending to be authoritative.
 *
 * What is here instead is the short list CI cannot help with: failures that are destructive,
 * invisible, or already committed by the time a red check appears. Everything else fails safe —
 * the branch goes red and nobody merges it.
 */

/**
 * The only shapes a proposal may write. `validate-content.mjs` classifies the same three, but it
 * is handed a path already relative to `content/` and so never checks that prefix — reusing it on
 * a caller-supplied string would accept `apps/backend/src.md` as a lesson. This pattern is
 * anchored and absolute on purpose, and is asserted again immediately before the git write.
 */
export const PROPOSAL_PATH_RE = /^content\/[a-z0-9-]+\/(?:_course\.md|[a-z0-9-]+\/(?:_module\.md|[a-z0-9-]+\.md))$/

/** Frontmatter must open at byte 0. Shared by every content script; kept identical here. */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** A question marker owns its whole line, per `scripts/lib/tests-md.mjs`. */
const Q_MARKER_RE = /^<!--\s*q(?::\s*([^\s>]+))?\s*-->$/
/** Ids assigned to existing questions and options, spliced in by `yarn content:assign-ids`. */
const Q_ID_RE = /^<!--\s*q:\s*([^\s>]+)\s*-->$/
const OPTION_ID_RE = /<!--\s*a:\s*([^\s>]+)\s*-->\s*$/

const ID_LINE_RE = /^id:.*$/m

export type ContentRule = 'path' | 'frontmatter' | 'structural-id' | 'question-marker' | 'question-ids'

export interface ContentRuleViolation {
  rule: ContentRule
  message: string
}

export interface ProposalFile {
  /** Repo-relative path this proposal writes. */
  path: string
  /** The file at the base commit, or null when the proposal creates it. */
  base: string | null
  /** The file as submitted, already normalised to LF with a single trailing newline. */
  submitted: string
}

/** The frontmatter block's inner text, or null when the file does not open with one. */
function frontmatterBlock(source: string): string | null {
  return source.match(FRONTMATTER_RE)?.[1] ?? null
}

/** Everything after the frontmatter block. */
function bodyOf(source: string): string {
  const match = source.match(FRONTMATTER_RE)
  return match ? source.slice(match[0].length) : source
}

/** The literal `id:` line, compared byte for byte rather than by parsed value. */
function idLine(block: string): string | null {
  return block.match(ID_LINE_RE)?.[0] ?? null
}

function markerIds(source: string, re: RegExp): Set<string> {
  const ids = new Set<string>()
  for (const line of source.split('\n')) {
    const id = line.trim().match(re)?.[1]
    if (id) ids.add(id)
  }
  return ids
}

function optionIds(source: string): Set<string> {
  const ids = new Set<string>()
  for (const line of source.split('\n')) {
    const id = line.match(OPTION_ID_RE)?.[1]
    if (id) ids.add(id)
  }
  return ids
}

function checkPath(file: ProposalFile, out: ContentRuleViolation[]): void {
  if (!PROPOSAL_PATH_RE.test(file.path)) {
    out.push({ rule: 'path', message: `${file.path} is not a lesson, module or course file under content/` })
  }
}

function checkFrontmatter(block: string | null, out: ContentRuleViolation[]): Record<string, unknown> | null {
  if (block === null) {
    out.push({ rule: 'frontmatter', message: 'The file must start with a --- frontmatter block on its first line' })
    return null
  }
  let parsed: unknown
  try {
    parsed = parseYaml(block)
  } catch (e) {
    out.push({ rule: 'frontmatter', message: `The frontmatter is not valid YAML: ${(e as Error).message}` })
    return null
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    out.push({ rule: 'frontmatter', message: 'The frontmatter must be a block of key: value pairs' })
    return null
  }
  return parsed as Record<string, unknown>
}

/**
 * An `id` is minted after merge by `content-sync.yml` and must never be authored or altered here.
 *
 * Authoring one that collides with a live row makes `sync-content-db.ts` treat the file as not-new,
 * so no row is ever inserted and the file silently addresses somebody else's lesson. When the
 * hijacked row is a test, `sync-tests.mjs` then deletes that lesson's real questions and prunes
 * every learner's saved answers in the same transaction. `validate-content.mjs` cannot catch it:
 * it only compares ids declared in other content files, and a CMS-authored row has no file.
 */
function checkStructuralId(file: ProposalFile, submittedBlock: string, out: ContentRuleViolation[]): void {
  const submittedId = idLine(submittedBlock)

  if (file.base === null) {
    if (submittedId !== null) {
      out.push({
        rule: 'structural-id',
        message: 'A new file must not declare an id — one is assigned automatically when the pull request is merged',
      })
    }
    return
  }

  const baseId = idLine(frontmatterBlock(file.base) ?? '')
  if (baseId !== submittedId) {
    out.push({
      rule: 'structural-id',
      message:
        baseId === null
          ? 'This file has no id yet; do not add one'
          : `The existing "${baseId}" line must stay exactly as it is`,
    })
  }
}

/**
 * `stripTestQuestions` truncates a rendered lesson at the first question marker, for every lesson
 * type — so a stray `<!-- q -->` in a lecture silently deletes the rest of the page from the site.
 * Nothing in CI catches this, which is why it is checked before the write rather than after.
 */
function checkQuestionMarkers(frontmatter: Record<string, unknown>, body: string, out: ContentRuleViolation[]): void {
  if (frontmatter.type === 'test') return
  const hasMarker = body.split('\n').some((line) => Q_MARKER_RE.test(line.trim()))
  if (hasMarker) {
    out.push({
      rule: 'question-marker',
      message: 'A <!-- q --> marker only belongs in a lesson with `type: test`; here it would hide everything below it',
    })
  }
}

/**
 * Question and option ids ride in `<!-- q:ID -->` and trailing `<!-- a:ID -->` comments. Losing one
 * reaches the same destructive prune as a changed structural id: `sync-tests.mjs` treats the id as
 * deleted and clears every learner's stored answer for it. A question-card editor re-emits option
 * lines by construction, so this is checked rather than assumed.
 */
function checkQuestionIds(file: ProposalFile, out: ContentRuleViolation[]): void {
  if (file.base === null) return

  const baseBody = bodyOf(file.base)
  const submittedBody = bodyOf(file.submitted)

  const lost = (kind: string, before: Set<string>, after: Set<string>) => {
    const missing = [...before].filter((id) => !after.has(id))
    if (missing.length > 0) {
      out.push({
        rule: 'question-ids',
        message: `${missing.length} existing ${kind} id(s) went missing (${missing.slice(0, 3).join(', ')}). Keep every <!-- q:… --> and <!-- a:… --> comment; removing one erases learners' saved answers`,
      })
    }
  }

  lost('question', markerIds(baseBody, Q_ID_RE), markerIds(submittedBody, Q_ID_RE))
  lost('option', optionIds(baseBody), optionIds(submittedBody))
}

/** Every violation found, so the editor can show them all at once instead of one per round-trip. */
export function checkContentRules(file: ProposalFile): ContentRuleViolation[] {
  const violations: ContentRuleViolation[] = []

  checkPath(file, violations)

  const block = frontmatterBlock(file.submitted)
  const frontmatter = checkFrontmatter(block, violations)
  if (block === null || frontmatter === null) return violations

  checkStructuralId(file, block, violations)
  checkQuestionMarkers(frontmatter, bodyOf(file.submitted), violations)
  checkQuestionIds(file, violations)

  return violations
}

/**
 * Git stores what it is given, and the content pipeline's frontmatter regexes tolerate CRLF while
 * the question grammar anchors on `\n`. Normalising once here keeps a Windows contributor from
 * producing a diff that touches every line of the file.
 */
export function normaliseContent(content: string): string {
  return `${content.replace(/\r\n/g, '\n').replace(/\n+$/, '')}\n`
}
