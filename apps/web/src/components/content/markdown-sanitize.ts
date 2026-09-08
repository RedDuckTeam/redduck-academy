import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

// Security: a TIGHT rehype-sanitize allowlist that widens the default schema just enough
// to render our SVG diagrams and nothing dangerous. Excludes <script>, <foreignObject>,
// <image>, <use>, event handlers, and every href/xlink:href (so no external refs).
// Anything not listed is stripped — safe by default.
const SVG_TAGS = [
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'marker', 'linearGradient', 'radialGradient', 'stop',
  'clipPath', 'title', 'desc', 'symbol', 'pattern', 'mask',
]
// CSS properties a diagram has any reason to set. Everything that could lift an <svg> out of its
// wrapper and over the page — position, inset/top/left, z-index, width, height, transform, display,
// pointer-events — is absent on purpose: an overlay reads like an ordinary diagram in a pull-request
// diff, where 182 of them already carry a `style` attribute, so review is not a reliable filter for
// it. Values may not contain brackets, which keeps out url() and every other CSS function.
const SAFE_STYLE_PROPERTIES = [
  'background', 'background-color', 'color', 'fill', 'stroke',
  'font-family', 'font-size', 'font-style', 'font-weight', 'letter-spacing', 'opacity',
]
const SAFE_STYLE_RE = new RegExp(
  `^(?:\\s*(?:${SAFE_STYLE_PROPERTIES.join('|')})\\s*:\\s*[^;:()\\\\]+\\s*;?)+\\s*$`,
  'i',
)

// `className` is absent because the compiled stylesheet ships `.fixed`, `.inset-0` and `.z-50`, so
// a class list is simply a slower way to write the overlay that SAFE_STYLE_RE rejects. No lesson
// has ever used `class` on an <svg>.
const SVG_ATTRS = [
  ['style', SAFE_STYLE_RE],
  'role', 'ariaLabel', 'ariaHidden', 'id',
  'viewBox', 'xmlns', 'preserveAspectRatio', 'width', 'height',
  'fill', 'fillOpacity', 'fillRule', 'stroke', 'strokeWidth', 'strokeLinecap',
  'strokeLinejoin', 'strokeDasharray', 'strokeDashoffset', 'strokeOpacity', 'opacity',
  'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'dx', 'dy', 'transform', 'offset', 'textAnchor', 'dominantBaseline',
  'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing',
  'stopColor', 'stopOpacity', 'gradientUnits', 'gradientTransform', 'spreadMethod',
  'markerWidth', 'markerHeight', 'markerUnits', 'markerEnd', 'markerStart', 'markerMid',
  'refX', 'refY', 'orient', 'patternUnits', 'clipPathUnits', 'maskUnits',
]

/** SVG tags that are only ever meaningful inside an <svg>. `svg` itself is the entry point. */
const SVG_CHILD_TAGS = SVG_TAGS.filter((tag) => tag !== 'svg')

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...SVG_TAGS],
  attributes: {
    ...defaultSchema.attributes,
    // Presentation attributes are granted per SVG tag, never globally on `*` — on `*` they would
    // also apply to contributor HTML like <img>, which is how an overlay gets built.
    ...Object.fromEntries(SVG_TAGS.map((tag) => [tag, SVG_ATTRS])),
  },
  ancestors: {
    ...defaultSchema.ancestors,
    // Without this, `<title>` is accepted at top level, where it is the *document* title rather
    // than an SVG label, and the rest read as unknown elements outside their namespace.
    ...Object.fromEntries(SVG_CHILD_TAGS.map((tag) => [tag, ['svg']])),
  },
}

/** rehype pipeline for MarkdownContent: parse raw HTML (our <svg> diagrams), then sanitize. */
export const markdownRehypePlugins = [rehypeRaw, [rehypeSanitize, schema]] as never
