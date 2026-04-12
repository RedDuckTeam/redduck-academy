import { solidityLanguage } from './solidity'
import { anchorLanguage } from './anchor'
import type { Monaco } from '@monaco-editor/react'

function formatSolidity(code: string): string {
  const INDENT = '    '
  const lines = code.split('\n')
  let level = 0
  const out: string[] = []

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      out.push('')
      continue
    }

    // Count unquoted braces to determine indent delta for this line.
    // Closing braces/parens that START the line pull the indent back first.
    const opensLine = (line.match(/^[}\])]/) ? 0 : 0) // evaluated below
    const leadingClose = /^[}\])]/.test(line)
    if (leadingClose) level = Math.max(0, level - 1)

    out.push(INDENT.repeat(level) + line)

    // Net brace delta for everything on this line
    let delta = 0
    let inString = false
    let stringChar = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inString) {
        if (ch === '\\') { i++; continue }
        if (ch === stringChar) inString = false
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inString = true; stringChar = ch
      } else if (ch === '{' || ch === '[' || ch === '(') {
        delta++
      } else if (ch === '}' || ch === ']' || ch === ')') {
        if (!leadingClose || i > 0) delta--
      }
    }

    level = Math.max(0, level + delta)
  }

  return out.join('\n').trimEnd() + '\n'
}

export function registerLanguages(monaco: Monaco) {
  monaco.languages.register({ id: 'solidity' })
  monaco.languages.setMonarchTokensProvider('solidity', solidityLanguage)
  monaco.languages.registerDocumentFormattingEditProvider('solidity', {
    provideDocumentFormattingEdits(model) {
      return [{ range: model.getFullModelRange(), text: formatSolidity(model.getValue()) }]
    },
  })

  monaco.languages.register({ id: 'rust' })
  monaco.languages.setMonarchTokensProvider('rust', anchorLanguage)

  // TypeScript is built into Monaco — no tokenizer registration needed,
  // but we configure compiler options to avoid noisy type errors in the editor.
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    strict: false,
  })
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  })
}
