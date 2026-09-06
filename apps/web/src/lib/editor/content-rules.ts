import { FRONTMATTER_RE, TEST_QUESTION_MARKER_RE } from '@/lib/content/frontmatter'
import { readFrontmatter } from '@/lib/editor/frontmatter-patch'

/** Ids are minted after merge by `content-sync.yml`; the exact line is what the next run compares. */
const ID_LINE_RE = /^id:.*$/m

export interface ContentRuleViolation {
  line: number
  message: string
}

function frontmatterBlock(source: string): string {
  return source.match(FRONTMATTER_RE)?.[0] ?? ''
}

function lineAt(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length
}

export function checkContentRules(baseline: string, source: string): ContentRuleViolation[] {
  const violations: ContentRuleViolation[] = []
  const block = frontmatterBlock(source)

  // `stripTestQuestions` truncates at the first marker whatever the lesson type is, so one in a
  // lecture deletes the rest of the page from the site — and the preview shows exactly that.
  if (readFrontmatter(source)?.type !== 'test') {
    const marker = TEST_QUESTION_MARKER_RE.exec(source.slice(block.length))
    if (marker) {
      violations.push({
        line: lineAt(source, block.length + marker.index),
        message:
          'A <!-- q --> marker belongs only in a lesson with type: test. Here it hides everything below it — remove the marker, or change the type.',
      })
    }
  }

  const baseId = ID_LINE_RE.exec(frontmatterBlock(baseline))?.[0] ?? null
  const current = ID_LINE_RE.exec(block)
  if (baseId !== null && baseId !== (current?.[0] ?? null)) {
    violations.push({
      // The frontmatter itself when the line is gone altogether — there is nowhere else to point.
      line: current ? lineAt(source, current.index) : 1,
      message: `The id: line has to stay exactly as it was (${baseId}) — it is what joins this file to learners' saved progress.`,
    })
  }

  return violations
}
