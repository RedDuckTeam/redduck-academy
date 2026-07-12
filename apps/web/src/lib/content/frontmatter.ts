// YAML frontmatter helpers for the open-source content files. The frontmatter block
// is produced by scripts/dump-content.mjs (`---\n…\n---\n`); this is its sole reader
// in the app, so keep the delimiter contract here in one place.

export const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n?/

/** Strip the leading YAML frontmatter block from a Markdown string. */
export function stripFrontmatter(raw: string): string {
  const match = raw.match(FRONTMATTER_RE)
  return match ? raw.slice(match[0].length) : raw
}
