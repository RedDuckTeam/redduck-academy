// Shared Tailwind class strings for the two lesson-content renderers — `RichText` (the
// legacy Lexical path) and `MarkdownContent` (the Markdown path) — so their visual
// contract (blockquotes, inline code, anchors, diagram wrappers) stays identical.

export const blockquoteStyles =
  '[&_blockquote]:text [&_blockquote]:pl-2.5 [&_blockquote]:border-l [&_blockquote]:border-border'

export const anchorStyles = '[&_a]:text-primary [&_a]:underline'

export const codeStyles =
  '[&_p_code]:bg-border/40 [&_p_code]:text-primary [&_p_code]:border [&_p_code]:border-border [&_p_code]:rounded-[2px] [&_p_code]:px-[3px] [&_p_code]:py-[0px]'

export const svgWrapperClass = 'my-4 flex w-full justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full'

// Typography wrapper a lesson's prose is rendered in, on the lesson page and in the editor's
// preview alike — the preview is only trustworthy while it wraps at the same measure.
export const lessonProseClass = 'prose dark:prose-invert w-full max-w-none'
