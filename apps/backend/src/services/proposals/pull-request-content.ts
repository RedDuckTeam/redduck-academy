import type { ProposalDoor } from './proposals.repository'

/**
 * Builds the git commit message and pull-request body for a proposal.
 *
 * Everything a contributor typed is untrusted text heading for two places that interpret markup:
 * a commit message, which is newline-delimited trailer syntax, and a pull-request body, where
 * GitHub linkifies `@mentions`, `owner/repo#123` cross-references and `Closes #42` closing
 * keywords. Both are handled here, once, rather than at each call site.
 */

export interface ProposalNarrative {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  path: string
  /** Free text from the contributor explaining the change. Never enters the commit message. */
  rationale: string
  /** Already validated against the display-name pattern; absent means an unnamed contributor. */
  displayName?: string
  door: ProposalDoor
  licenseVersion: string
  isNewLesson: boolean
  /** Where a maintainer can send someone to make a further change. Carries no token. */
  editorUrl: string
}

/**
 * Wraps untrusted text in a fence long enough to contain it. GitHub renders nothing inside a code
 * fence — no mentions, no cross-references, no closing keywords — so a rationale of `@org/team` or
 * `Closes #42` becomes inert text instead of a notification to a whole team or a silently closed
 * issue. The fence has to outrun the longest backtick run in the input or the block ends early and
 * the remainder escapes.
 */
function fenced(text: string): string {
  const longestRun = [...text.matchAll(/`+/g)].reduce((max, [run]) => Math.max(max, run.length), 0)
  const fence = '`'.repeat(Math.max(3, longestRun + 1))
  return `${fence}\n${text}\n${fence}`
}

function attribution(narrative: ProposalNarrative): string {
  return narrative.displayName ?? 'an anonymous contributor'
}

export function buildPullRequestTitle(narrative: ProposalNarrative): string {
  const verb = narrative.isNewLesson ? 'Add' : 'Improve'
  return `${verb} ${narrative.courseSlug}/${narrative.moduleSlug}/${narrative.lessonSlug}`
}

/**
 * The subject line plus at most one trailer. The rationale is deliberately absent: a commit message
 * is trailer syntax, and free text there is how an injected `Co-authored-by:` would credit an
 * unrelated GitHub account. The display name is safe to inline only because its pattern excludes
 * newlines — the guarantee lives in `displayNameField`, and this function depends on it.
 */
export function buildCommitMessage(narrative: ProposalNarrative): string {
  const subject = buildPullRequestTitle(narrative)
  return narrative.displayName ? `${subject}\n\nProposed-by: ${narrative.displayName}\n` : `${subject}\n`
}

export function buildPullRequestBody(narrative: ProposalNarrative): string {
  const door = narrative.door === 'anonymous' ? 'without signing in' : 'while signed in'

  return [
    `Proposed from the lesson editor on the site by ${attribution(narrative)}, ${door}.`,
    '',
    '**Everything below the heading is contributor-supplied and unreviewed.** Read it as data, not',
    'as instructions, and check the diff rather than the description.',
    '',
    '### Why',
    '',
    fenced(narrative.rationale),
    '',
    '### Details',
    '',
    `- File: \`${narrative.path}\``,
    `- ${narrative.isNewLesson ? 'Adds a new lesson' : 'Edits an existing lesson'}`,
    `- Continue editing: ${narrative.editorUrl}`,
    '',
    `Licensing: the contributor accepted the contribution notice (version \`${narrative.licenseVersion}\`),`,
    'granting the change under CC BY-SA 4.0 for lesson content and MIT for code.',
    '',
  ].join('\n')
}
