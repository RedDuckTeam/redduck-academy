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
const SVG_ATTRS = [
  'className', 'style', 'role', 'ariaLabel', 'ariaHidden', 'id',
  'viewBox', 'xmlns', 'preserveAspectRatio', 'width', 'height',
  'fill', 'fillOpacity', 'fillRule', 'stroke', 'strokeWidth', 'strokeLinecap',
  'strokeLinejoin', 'strokeDasharray', 'strokeDashoffset', 'strokeOpacity', 'opacity',
  'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'dx', 'dy', 'transform', 'offset', 'textAnchor', 'dominantBaseline',
  'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing',
  'stopColor', 'stopOpacity', 'gradientUnits', 'gradientTransform', 'spreadMethod',
  'markerWidth', 'markerHeight', 'markerUnits', 'markerEnd', 'markerStart', 'markerMid',
  'refX', 'refY', 'orient', 'patternUnits', 'clipPathUnits', 'maskUnits',
]

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...SVG_TAGS],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), ...SVG_ATTRS],
  },
}

/** rehype pipeline for MarkdownContent: parse raw HTML (our <svg> diagrams), then sanitize. */
export const markdownRehypePlugins = [rehypeRaw, [rehypeSanitize, schema]] as never
