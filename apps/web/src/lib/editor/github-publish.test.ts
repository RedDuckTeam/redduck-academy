import { describe, expect, it } from 'vitest'
import { PREFILL_URL_LIMIT, githubEditUrl, githubNewFileUrl, lessonFilePath, prefillFits } from './github-publish'

describe('lessonFilePath', () => {
  it('mirrors the repository layout', () => {
    expect(lessonFilePath('blockchain-basics', 'cryptography', 'hashing')).toBe(
      'content/blockchain-basics/cryptography/hashing.md',
    )
  })
})

describe('githubEditUrl', () => {
  it('points at the file on the default branch', () => {
    expect(githubEditUrl('content/a/b/c.md')).toBe(
      'https://github.com/RedDuckTeam/redduck-academy/edit/main/content/a/b/c.md',
    )
  })
})

describe('githubNewFileUrl', () => {
  it('prefills the path alone when no content is passed', () => {
    expect(githubNewFileUrl('content/a/b/c.md')).toBe(
      'https://github.com/RedDuckTeam/redduck-academy/new/main?filename=content%2Fa%2Fb%2Fc.md',
    )
  })

  it('encodes a space as %20, never as +', () => {
    const url = githubNewFileUrl('content/a/b/c.md', '# Two words')
    expect(url).toContain('value=%23%20Two%20words')
    expect(url).not.toContain('+')
  })

  it('round-trips the content it encodes', () => {
    const content = '---\ntitle: Hashing & salt\n---\n\n# Body\n\n- [x] `code` 100% ~70 SOL\n'
    const value = new URL(githubNewFileUrl('content/a/b/c.md', content)).searchParams.get('value')
    expect(value).toBe(content)
  })
})

describe('prefillFits', () => {
  it('accepts a file the size of the lesson template', () => {
    expect(prefillFits('content/a/b/c.md', 'x'.repeat(1500))).toBe(true)
  })

  it('rejects a typical lesson, which is far over GitHub’s URL limit', () => {
    // The median file under content/ is ~10.6 KB of Markdown, ~15.8 KB once percent-encoded.
    expect(prefillFits('content/a/b/c.md', 'x'.repeat(10_000))).toBe(false)
  })

  it('decides on the encoded length, not the raw one', () => {
    // A newline costs three characters encoded, so this is well over the limit while under it raw.
    expect('\n'.repeat(PREFILL_URL_LIMIT - 500).length).toBeLessThan(PREFILL_URL_LIMIT)
    expect(prefillFits('content/a/b/c.md', '\n'.repeat(PREFILL_URL_LIMIT - 500))).toBe(false)
  })
})
