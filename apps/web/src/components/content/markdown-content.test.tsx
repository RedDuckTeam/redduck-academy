import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'

// Mock the heavy leaf components so the test targets MarkdownContent's own mapping
// logic (structure, embed detection, code/lang extraction, sanitization) without
// booting shiki / iframe fullscreen / the mining animation.
vi.mock('@/components/ui/highlighted-code-block', () => ({
  HighlightedCodeBlock: ({ code, language }: { code: string; language?: string }) => (
    <pre data-lang={language ?? ''}>{code}</pre>
  ),
}))
vi.mock('@/components/ui/embed-frame', () => ({
  EmbedFrame: ({ src, title }: { src: string; title: string }) => (
    <iframe data-embed src={src} title={title} />
  ),
}))
vi.mock('@/components/ui/block-mining-simulator', () => ({
  BlockMiningSimulator: () => <div data-block-mining />,
}))
vi.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { MarkdownContent } from './markdown-content'
import { extractMarkdownHeadings } from '@/components/pages/lesson/toc/build-toc-items'
import { stripFrontmatter, stripTestQuestions } from '@/lib/content/frontmatter'

const md = [
  '# Should be h1',
  '',
  'Intro paragraph with `inline code` and a [link](https://example.com).',
  '',
  '## A section',
  '',
  '```solidity',
  'contract C {}',
  '```',
  '',
  '<svg role="img" viewBox="0 0 10 10" style="background:#eee"><title>Diagram</title><rect x="0" y="0" width="10" height="10" fill="#000"></rect><script>window.__pwned = 1</script></svg>',
  '',
  '[interactive playground](https://plgrnd.io/#flow=abc)',
  '',
  '| Col A | Col B |',
  '| --- | --- |',
  '| a1 | b1 |',
  '',
  '- item one',
  '- item two',
  '',
  '> a quote',
  '',
  '[[block-mining]]',
  '',
].join('\n')

describe('MarkdownContent', () => {
  // Fail the tests on React's HTML-correctness warnings (invalid nesting, SVG elements
  // rendered outside the SVG namespace) — these break SSR hydration and diagram rendering.
  let consoleErrors: string[] = []
  beforeEach(() => {
    consoleErrors = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      consoleErrors.push(args.map(String).join(' '))
    })
  })
  afterEach(() => {
    const bad = consoleErrors.filter((e) =>
      /unrecognized in this browser|cannot be a descendant|cannot contain a nested/i.test(e),
    )
    expect(bad).toEqual([])
  })

  it('renders every content construct and sanitizes injected scripts', () => {
    const { container } = render(<MarkdownContent source={md} />)

    // Headings carry TOC-matching slug ids.
    expect(container.querySelector('#should-be-h1')?.querySelector('h1')).toBeTruthy()
    expect(container.querySelector('#a-section')).toBeTruthy()

    // Inline code + external link.
    expect([...container.querySelectorAll('code')].map((c) => c.textContent)).toContain('inline code')
    const link = container.querySelector('a[href="https://example.com"]')
    expect(link?.getAttribute('target')).toBe('_blank')

    // Fenced code -> highlighted block with language.
    const pre = container.querySelector('pre[data-lang="solidity"]')
    expect(pre?.textContent).toContain('contract C {}')

    // SVG renders (title/rect kept) but the injected <script> is stripped.
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.querySelector('title')?.textContent).toBe('Diagram')
    expect(svg?.querySelector('rect')).toBeTruthy()
    expect(container.querySelector('script')).toBeNull()
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()

    // plgrnd link paragraph becomes an embed, not a bare link.
    const iframe = container.querySelector('iframe[data-embed]')
    expect(iframe?.getAttribute('src')).toBe('https://plgrnd.io/#flow=abc')

    // GFM table.
    expect(container.querySelectorAll('th').length).toBe(2)
    expect([...container.querySelectorAll('td')].some((td) => td.textContent === 'a1')).toBe(true)

    // List, blockquote, block-mining shortcode.
    expect(container.querySelectorAll('ul li').length).toBe(2)
    expect(container.querySelector('blockquote')?.textContent).toContain('a quote')
    expect(container.querySelector('[data-block-mining]')).toBeTruthy()

    // No <div>-inside-<p> (would break SSR hydration).
    expect(container.querySelector('p div')).toBeNull()
  })

  it('opens external links in a new tab but keeps internal /courses links same-tab', () => {
    const { container } = render(
      <MarkdownContent
        source={'[ext](https://example.com) and [lesson](/courses/a/b/c)'}
      />,
    )
    const ext = container.querySelector('a[href="https://example.com"]')
    expect(ext?.getAttribute('target')).toBe('_blank')
    expect(ext?.getAttribute('rel')).toContain('noopener')

    const internal = container.querySelector('a[href="/courses/a/b/c"]')
    expect(internal).toBeTruthy()
    expect(internal?.getAttribute('target')).toBeNull() // same tab
  })

  it('neutralizes injected scripts, handlers, protocols, and unsafe elements', () => {
    delete (window as unknown as { __pwned?: number }).__pwned
    const attack = [
      '[a](javascript:alert(1))',
      '',
      '<a href="javascript:alert(2)">b</a>',
      '',
      '<img src=x onerror="window.__pwned=1">',
      '',
      '<img src="https://ex.com/a.png" style="position:fixed;inset:0;width:100vw;height:100vh">',
      '',
      '<iframe src="https://evil.example"></iframe>',
      '',
      '<svg onload="window.__pwned=2"><rect onclick="window.__pwned=3" width="10" height="10"></rect>' +
        '<a xlink:href="javascript:alert(4)"><text>x</text></a>' +
        '<foreignObject><div>nested</div></foreignObject><use href="#x"></use>' +
        '<script>window.__pwned=5</script></svg>',
      '',
    ].join('\n')

    const { container } = render(<MarkdownContent source={attack} />)

    // No code ran, no dangerous elements survived.
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
    for (const tag of ['script', 'iframe', 'foreignObject', 'foreignobject', 'use']) {
      expect(container.querySelector(tag), `<${tag}> survived`).toBeNull()
    }
    // No event-handler attributes anywhere.
    const withHandlers = [...container.querySelectorAll('*')].filter((el) =>
      [...el.attributes].some((a) => a.name.startsWith('on')),
    )
    expect(withHandlers.map((e) => e.tagName)).toEqual([])
    // No javascript: hrefs.
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull()
    // `style` is scoped to SVG elements only, so a non-SVG element can't keep it — this is
    // what stops an injected <img style="position:fixed;…"> from covering the page.
    expect(
      container.querySelector('img[src="https://ex.com/a.png"]')?.getAttribute('style'),
      'style survived on a non-SVG element',
    ).toBeNull()
  })

  it('renders a real dumped lesson (multi-line SVGs, real code fences, plgrnd embed)', () => {
    // vitest runs with cwd = apps/web; the content tree lives at the repo root.
    const raw = readFileSync(
      resolve(process.cwd(), '../../content/blockchain-basics/cryptography/hashing.md'),
      'utf8',
    )
    const body = stripFrontmatter(raw)

    const { container } = render(<MarkdownContent source={body} />)

    // All three diagrams reassemble into real <svg> elements with their baked-in <title>.
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(3)
    svgs.forEach((s) => expect(s.querySelector('title')?.textContent?.length).toBeGreaterThan(0))

    // The long plgrnd share link becomes an embed.
    expect(container.querySelector('iframe[data-embed]')?.getAttribute('src')).toContain('plgrnd.io')

    // Code fences render as highlighted blocks; nothing dangerous survived.
    expect(container.querySelectorAll('pre').length).toBeGreaterThan(0)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('p div')).toBeNull()
  })

  it('TOC extractor ids match the rendered heading ids (real lesson)', () => {
    const body = stripFrontmatter(
      readFileSync(resolve(process.cwd(), '../../content/blockchain-basics/cryptography/hashing.md'), 'utf8'),
    )

    const { container } = render(<MarkdownContent source={body} />)
    const renderedIds = [...container.querySelectorAll('.scroll-mt-20')].map((el) => el.id)
    const tocIds = extractMarkdownHeadings(body).map((h) => h.id)

    expect(tocIds.length).toBeGreaterThan(0)
    expect(tocIds).toEqual(renderedIds)
  })

  it('renders every lesson in the corpus with no stray svg, scripts, or warnings', () => {
    const root = resolve(process.cwd(), '../../content')
    const files = readdirSync(root, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.md') && !f.endsWith('README.md'))
    expect(files.length).toBeGreaterThan(100)

    const svgChildTags = ['path', 'rect', 'text', 'marker', 'defs', 'line', 'polygon', 'circle', 'g', 'polyline']
    for (const rel of files) {
      // The app renders only a lesson's display prose; a test's question block is stripped
      // (rendered interactively from the DB instead), so mirror that here.
      const body = stripTestQuestions(stripFrontmatter(readFileSync(resolve(root, rel), 'utf8')))
      const { container, unmount } = render(<MarkdownContent source={body} />)

      const stray = svgChildTags
        .flatMap((t) => [...container.querySelectorAll(t)])
        .filter((e) => !e.closest('svg'))
      expect(stray, `stray svg elements in ${rel}`).toHaveLength(0)
      expect(container.querySelector('script'), `<script> survived in ${rel}`).toBeNull()

      const bad = consoleErrors.filter((e) =>
        /unrecognized in this browser|cannot be a descendant|cannot contain a nested/i.test(e),
      )
      expect(bad, `React warnings in ${rel}`).toEqual([])
      consoleErrors = []
      unmount()
    }
  })
})
