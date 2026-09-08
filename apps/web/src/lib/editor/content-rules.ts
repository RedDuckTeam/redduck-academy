import { FRONTMATTER_RE, TEST_QUESTION_MARKER_RE } from '@/lib/content/frontmatter'

export interface ContentRuleViolation {
  line: number
  message: string
}

export function checkContentRules(source: string): ContentRuleViolation[] {
  const violations: ContentRuleViolation[] = []
  const body = source.slice(source.match(FRONTMATTER_RE)?.[0].length ?? 0)
  const lineAt = (offset: number) => body.slice(0, offset).split('\n').length

  const marker = TEST_QUESTION_MARKER_RE.exec(body)
  if (marker) {
    violations.push({
      line: lineAt(marker.index),
      message:
        'The line <!-- q --> only works in a test lesson. Here it hides everything written below it, so delete that line.',
    })
  }

  const opening = body.match(/<svg\b/g)?.length ?? 0
  const closing = body.match(/<\/svg>/g)?.length ?? 0
  if (opening !== closing) {
    violations.push({
      // Whichever tag comes first: searching only for the opening one returns -1 when that is the missing half.
      line: lineAt(body.search(/<\/?svg\b/)),
      message: `A diagram is incomplete: ${opening} <svg> and ${closing} </svg>. Each <svg> needs its own </svg> before you can propose the change.`,
    })
  }

  return violations
}
