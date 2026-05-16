import type { CodeBlock as CodeBlockFn } from '@payloadcms/richtext-lexical'

export const CODE_BLOCK_PLAIN_LANGUAGE = 'plain'

export const CODE_BLOCK_LANGUAGES = {
  plain: 'Plain',
  typescript: 'TypeScript',
  rust: 'Rust',
  solidity: 'Solidity',
} as const

export function buildCodeBlock(codeBlock: typeof CodeBlockFn) {
  const block = codeBlock({
    slug: 'code',
    defaultLanguage: CODE_BLOCK_PLAIN_LANGUAGE,
    languages: { ...CODE_BLOCK_LANGUAGES },
  }) as ReturnType<typeof codeBlock> & { jsx?: any }

  if (block.jsx?.import) {
    const originalImport = block.jsx.import
    block.jsx.import = (args: Parameters<typeof originalImport>[0]) => {
      const result = originalImport(args)
      if (result && typeof result === 'object' && 'language' in result) {
        const language = (result as { language?: string }).language
        if (!language) {
          ;(result as { language?: string }).language = CODE_BLOCK_PLAIN_LANGUAGE
        }
      }
      return result
    }
  }

  if (block.jsx?.export) {
    const originalExport = block.jsx.export
    block.jsx.export = (args: any) => {
      const fields = args?.fields as { code?: string; language?: string } | undefined
      if (fields?.language === CODE_BLOCK_PLAIN_LANGUAGE) {
        return originalExport({ ...args, fields: { ...fields, language: '' } })
      }
      return originalExport(args)
    }
  }

  return block
}
