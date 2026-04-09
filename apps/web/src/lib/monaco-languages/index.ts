import { solidityLanguage } from './solidity'
import { anchorLanguage } from './anchor'
import type { Monaco } from '@monaco-editor/react'

export function registerLanguages(monaco: Monaco) {
  monaco.languages.register({ id: 'solidity' })
  monaco.languages.setMonarchTokensProvider('solidity', solidityLanguage)

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
