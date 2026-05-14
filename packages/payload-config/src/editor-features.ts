import {
  BlocksFeature,
  CodeBlock,
  HeadingFeature,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

// Roundtrips raw <svg>...</svg> markdown blocks into a dedicated Lexical block so the
// editor can preview the diagram instead of showing the markup as plain text.
const svgBlock: Block = {
  slug: 'svg',
  labels: { singular: 'SVG diagram', plural: 'SVG diagrams' },
  fields: [
    {
      name: 'markup',
      type: 'textarea',
      required: true,
      label: 'SVG markup',
      admin: {
        rows: 12,
        components: {
          Field: '@/admin-components/svg-markup-field#SvgMarkupField',
        },
      },
    },
  ],
  jsx: {
    customStartRegex: /^<svg\b[^>]*>/,
    customEndRegex: /<\/svg>\s*$/,
    doNotTrimChildren: true,
    export: ({ fields }) => fields.markup ?? '',
    import: ({ children, openMatch, closeMatch }) => {
      const open = openMatch?.[0] ?? '<svg>'
      const close = closeMatch?.[0] ?? '</svg>'
      const body = children ?? ''
      const trimmedBody = body.replace(/^\n+/, '').replace(/\n+$/, '')
      const markup = trimmedBody ? `${open}\n${trimmedBody}\n${close}` : `${open}${close}`
      return { markup }
    },
  },
}

export const rootEditorFeatures = ({ defaultFeatures }: { defaultFeatures: any[] }) => [
  ...defaultFeatures,
  EXPERIMENTAL_TableFeature(),
  HeadingFeature({
    enabledHeadingSizes: ['h1', 'h2', 'h3'],
  }),
  BlocksFeature({
    blocks: [
      CodeBlock({
        slug: 'code',
        defaultLanguage: 'typescript',
        languages: {
          typescript: 'TypeScript',
          rust: 'Rust',
          solidity: 'Solidity',
        },
      }),
      svgBlock,
    ],
  }),
]
