import {
  BlocksFeature,
  CodeBlock,
  HeadingFeature,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'

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
    ],
  }),
]
