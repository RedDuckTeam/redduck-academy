import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownRehypePlugins } from '@/components/content/markdown-sanitize'
import { htmlToMarkdown } from './html-to-markdown'

// What the contributor pastes has to survive two hops — HTML to Markdown here, Markdown back to a
// rendered lesson later — so the tests assert on the rendering, through the lesson renderer's own
// plugins, rather than on the exact escapes.
const rendered = (html: string) =>
  render(
    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={markdownRehypePlugins}>
      {htmlToMarkdown(html)}
    </Markdown>,
  ).container

describe('htmlToMarkdown', () => {
  it.each([
    ['1. Install the toolchain, then run the tests.'],
    ['# is how a Bash comment starts.'],
    ['- 40% of the supply, + the treasury.'],
    ['> Chevrons are how a shell prompt is written.'],
    ['Multiply a*b*c to get the id.'],
    ['Write [label](target) to make a link.'],
    ['Wrap it in `backticks` to make code.'],
    ['Wrap it in <div> and <span> tags.'],
    ['Escape the star with \\* to print it.'],
  ])('renders pasted prose as the text it was pasted as: %s', (text) => {
    const html = `<p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    expect(rendered(html).textContent).toBe(text)
  })

  it('leaves intraword underscores alone rather than pepper identifiers with backslashes', () => {
    const markdown = htmlToMarkdown('<p>Call spl_token_transfer, not _transfer.</p>')

    expect(markdown).toContain('spl_token_transfer')
    expect(rendered('<p>Call spl_token_transfer, not _transfer.</p>').querySelector('em')).toBeNull()
  })

  it('does not escape the Markdown it emits itself', () => {
    const container = rendered(
      '<h2>A section</h2><p><strong>Bold</strong> and <em>italic</em> and a ' +
        '<a href="https://example.com">link</a>.</p><ul><li>an item</li></ul>',
    )

    expect(container.querySelector('h2')?.textContent).toBe('A section')
    expect(container.querySelector('strong')?.textContent).toBe('Bold')
    expect(container.querySelector('em')?.textContent).toBe('italic')
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com')
    expect(container.querySelector('li')?.textContent).toBe('an item')
  })

  it('keeps a code span literal, backticks and all', () => {
    const container = rendered('<p><code>a_b(*x)</code> and <code>md`tick`</code></p>')

    expect([...container.querySelectorAll('code')].map((code) => code.textContent)).toEqual(['a_b(*x)', 'md`tick`'])
  })

  it('keeps a definition list from running its terms into its definitions', () => {
    const container = rendered('<dl><dt>Nonce</dt><dd>A counter.</dd><dt>Hash</dt><dd>A digest.</dd></dl>')

    expect([...container.querySelectorAll('strong')].map((term) => term.textContent)).toEqual(['Nonce', 'Hash'])
    expect(container.textContent).toContain('A counter.')
  })

  // The lesson renderer replaces a paragraph that contains an <svg> with the diagram alone, so an
  // icon left inline would take the sentence around it down with it. Splitting keeps the prose.
  it('lifts an inline svg out of the paragraph instead of leaving it in the prose', () => {
    const markdown = htmlToMarkdown('<p>Before <svg viewBox="0 0 1 1"><rect/></svg> after.</p>')

    expect(markdown.split('\n\n')).toEqual(['Before', '<svg viewBox="0 0 1 1"><rect></rect></svg>', 'after.'])
  })
})
