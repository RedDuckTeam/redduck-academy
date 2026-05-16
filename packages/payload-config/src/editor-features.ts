import {
  BlocksFeature,
  CodeBlock,
  HeadingFeature,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'

import { buildCodeBlock } from './rich-text/code-block'

export const rootEditorFeatures = ({ defaultFeatures }: { defaultFeatures: any[] }) => [
  ...defaultFeatures,
  EXPERIMENTAL_TableFeature(),
  HeadingFeature({
    enabledHeadingSizes: ['h1', 'h2', 'h3'],
  }),
  BlocksFeature({
    blocks: [buildCodeBlock(CodeBlock)],
  }),
]
