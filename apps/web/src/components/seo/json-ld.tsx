interface JsonLdProps {
  /** A single schema.org node, or several to emit together. */
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Renders a schema.org JSON-LD `<script>`. Safe to place anywhere in the page
 * tree — lesson/course routes are SSR'd, so crawlers and AI bots see it in the
 * served HTML. `<` is escaped to `<` so a `</script>` appearing inside any
 * string field (e.g. a lesson description) can't break out of the tag.
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
