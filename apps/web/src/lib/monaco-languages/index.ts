import { solidityLanguage } from './solidity'
import { rustLanguage } from './rust'
import type { Monaco } from '@monaco-editor/react'

export function registerLanguages(monaco: Monaco) {
  monaco.languages.register({ id: 'solidity' })
  monaco.languages.setMonarchTokensProvider('solidity', solidityLanguage)

  monaco.languages.register({ id: 'rust' })
  monaco.languages.setMonarchTokensProvider('rust', rustLanguage)
}
