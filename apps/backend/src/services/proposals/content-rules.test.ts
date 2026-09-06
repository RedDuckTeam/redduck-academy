import { describe, it, expect } from 'vitest'
import { checkContentRules, normaliseContent, PROPOSAL_PATH_RE, type ProposalFile } from './content-rules'

const LESSON_PATH = 'content/blockchain-basics/cryptography/hashing.md'

function lesson(frontmatter: string, body = '\n## A section\n\nText.\n'): string {
  return `---\n${frontmatter}\n---\n${body}`
}

function file(overrides: Partial<ProposalFile> = {}): ProposalFile {
  return {
    path: LESSON_PATH,
    base: lesson('id: 1000000042\ntitle: Hashing\ntype: lecture\norder: 10'),
    submitted: lesson('id: 1000000042\ntitle: Hashing\ntype: lecture\norder: 10', '\n## Edited\n\nText.\n'),
    ...overrides,
  }
}

const rules = (f: ProposalFile) => checkContentRules(f).map((v) => v.rule)

describe('PROPOSAL_PATH_RE', () => {
  it.each([
    'content/blockchain-basics/cryptography/hashing.md',
    'content/blockchain-basics/cryptography/_module.md',
    'content/blockchain-basics/_course.md',
  ])('accepts %s', (path) => {
    expect(PROPOSAL_PATH_RE.test(path)).toBe(true)
  })

  // The validator this mirrors is handed a path already relative to content/, so it never checks
  // the prefix; anything the write path can be tricked into putting in a tree entry is written.
  it.each([
    '.github/workflows/pwn.yml',
    'package.json',
    '.yarnrc.yml',
    'scripts/validate-content.mjs',
    'apps/backend/src.md',
    'content/a/b/../../../package.json',
    'content/a/b/c/d.md',
    'content/a/b/README.md',
    'content/a/b/Hashing.md',
    'content/a/b/c.md ',
  ])('rejects %s', (path) => {
    expect(PROPOSAL_PATH_RE.test(path)).toBe(false)
  })
})

describe('checkContentRules', () => {
  it('passes an ordinary prose edit', () => {
    expect(checkContentRules(file())).toEqual([])
  })

  it('rejects a path outside content/', () => {
    expect(rules(file({ path: '.github/workflows/pwn.yml' }))).toContain('path')
  })

  it('rejects a file that does not open with frontmatter', () => {
    expect(rules(file({ submitted: '## No frontmatter\n' }))).toContain('frontmatter')
  })

  it('rejects a leading blank line before the frontmatter', () => {
    expect(rules(file({ submitted: `\n${lesson('title: X\ntype: lecture\norder: 10')}` }))).toContain('frontmatter')
  })

  it('rejects unparseable frontmatter', () => {
    expect(rules(file({ submitted: lesson('title: [unclosed') }))).toContain('frontmatter')
  })

  describe('structural id', () => {
    it('rejects a changed id', () => {
      const submitted = lesson('id: 1999999999\ntitle: Hashing\ntype: lecture\norder: 10')
      expect(rules(file({ submitted }))).toContain('structural-id')
    })

    it('rejects a removed id', () => {
      const submitted = lesson('title: Hashing\ntype: lecture\norder: 10')
      expect(rules(file({ submitted }))).toContain('structural-id')
    })

    it('rejects an id authored on a new file', () => {
      const submitted = lesson('id: 1000000999\ntitle: New\ntype: lecture\norder: 10')
      expect(rules(file({ base: null, submitted }))).toContain('structural-id')
    })

    it('accepts a new file with no id', () => {
      const submitted = lesson('title: New\ntype: lecture\norder: 10')
      expect(rules(file({ base: null, submitted }))).toEqual([])
    })

    it('treats whitespace around the id as a change, since the line is compared byte for byte', () => {
      const submitted = lesson('id:  1000000042\ntitle: Hashing\ntype: lecture\norder: 10')
      expect(rules(file({ submitted }))).toContain('structural-id')
    })
  })

  describe('question markers', () => {
    it('rejects a question marker in a lecture', () => {
      const submitted = lesson('id: 1000000042\ntitle: Hashing\ntype: lecture\norder: 10', '\n<!-- q -->\nWhat?\n')
      expect(rules(file({ submitted }))).toContain('question-marker')
    })

    it('allows question markers in a test', () => {
      const fm = 'id: 1000000042\ntitle: Quiz\ntype: test\norder: 10'
      const body = '\n<!-- q -->\nWhat?\n\n- [x] Yes\n- [ ] No\n'
      expect(rules(file({ base: lesson(fm, body), submitted: lesson(fm, body) }))).toEqual([])
    })

    it('ignores a marker that is only part of a longer line', () => {
      const submitted = lesson(
        'id: 1000000042\ntitle: Hashing\ntype: lecture\norder: 10',
        '\nUse `<!-- q -->` to start a question.\n',
      )
      expect(rules(file({ submitted }))).toEqual([])
    })
  })

  describe('question and option ids', () => {
    const fm = 'id: 1000000042\ntitle: Quiz\ntype: test\norder: 10'
    const withIds =
      '\n<!-- q:6a1cb87a3c68b19723964330 -->\nWhat?\n\n- [x] Yes  <!-- a:6a1cb87a3c68b19723964331 -->\n- [ ] No  <!-- a:6a1cb87a3c68b19723964332 -->\n'

    it('accepts an edit that keeps every id', () => {
      const submitted = withIds.replace('What?', 'What is it?')
      expect(rules(file({ base: lesson(fm, withIds), submitted: lesson(fm, submitted) }))).toEqual([])
    })

    it('rejects a dropped option id trailer', () => {
      const submitted = withIds.replace('  <!-- a:6a1cb87a3c68b19723964331 -->', '')
      expect(rules(file({ base: lesson(fm, withIds), submitted: lesson(fm, submitted) }))).toContain('question-ids')
    })

    it('rejects a dropped question id', () => {
      const submitted = withIds.replace('<!-- q:6a1cb87a3c68b19723964330 -->', '<!-- q -->')
      expect(rules(file({ base: lesson(fm, withIds), submitted: lesson(fm, submitted) }))).toContain('question-ids')
    })

    it('allows adding a new question alongside the existing ones', () => {
      const submitted = `${withIds}\n<!-- q -->\nA new one?\n\n- [x] Yes\n- [ ] No\n`
      expect(rules(file({ base: lesson(fm, withIds), submitted: lesson(fm, submitted) }))).toEqual([])
    })
  })

  it('reports every violation at once rather than stopping at the first', () => {
    const submitted = lesson('id: 1999999999\ntitle: Hashing\ntype: lecture\norder: 10', '\n<!-- q -->\n')
    expect(rules(file({ path: 'package.json', submitted })).sort()).toEqual(
      ['path', 'question-marker', 'structural-id'].sort(),
    )
  })
})

describe('normaliseContent', () => {
  it('converts CRLF so a Windows editor does not rewrite every line', () => {
    expect(normaliseContent('---\r\ntitle: X\r\n---\r\n')).toBe('---\ntitle: X\n---\n')
  })

  it('collapses trailing blank lines to exactly one newline', () => {
    expect(normaliseContent('text\n\n\n')).toBe('text\n')
    expect(normaliseContent('text')).toBe('text\n')
  })
})
