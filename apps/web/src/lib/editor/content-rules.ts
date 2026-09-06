import { FRONTMATTER_RE, TEST_QUESTION_MARKER_RE } from '@/lib/content/frontmatter'

export interface ContentRuleViolation {
  /** Line within the body, which is what the editor's buffer holds. */
  line: number
  message: string
}

// The cheap half of what `scripts/validate-content.mjs` enforces on the pull request: the two of
// its rules an ordinary edit can break, caught here so the contributor learns before GitHub does.
export function checkContentRules(source: string): ContentRuleViolation[] {
  const violations: ContentRuleViolation[] = []
  const body = source.slice(source.match(FRONTMATTER_RE)?.[0].length ?? 0)
  const lineAt = (offset: number) => body.slice(0, offset).split('\n').length

  // stripTestQuestions truncates at the first marker whatever the lesson type is, so one in a
  // lecture deletes the rest of the page from the site.
  const marker = TEST_QUESTION_MARKER_RE.exec(body)
  if (marker) {
    violations.push({
      line: lineAt(marker.index),
      message:
        'A <!-- q --> marker belongs only in a lesson with type: test. Here it hides everything below it — remove the marker, or change the type.',
    })
  }

  const opening = body.match(/<svg\b/g)?.length ?? 0
  const closing = body.match(/<\/svg>/g)?.length ?? 0
  if (opening !== closing) {
    violations.push({
      line: lineAt(body.search(/<svg\b/)),
      message: `A diagram is missing part of itself: ${opening} <svg> against ${closing} </svg>. The pull request will not pass without both.`,
    })
  }

  return violations
}
