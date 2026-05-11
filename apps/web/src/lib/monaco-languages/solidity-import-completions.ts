import { STDLIB_PATHS } from '@redduck/solc-utils'
import type { Monaco } from '@monaco-editor/react'

/** Minimal Monaco surface we touch — keeps us off a direct `monaco-editor` type import. */
type MonacoTextModel = {
  getLineContent(line: number): string
  getWordUntilPosition(position: MonacoPosition): { startColumn: number; endColumn: number }
}
type MonacoPosition = { lineNumber: number; column: number }

/**
 * Register a Solidity completion provider that suggests bundled stdlib paths
 * (OpenZeppelin etc.) while the user is typing inside an `import "..."` literal.
 *
 * Trigger characters are `"` (start of literal) and `/` (next path segment), so the
 * dropdown appears progressively as the user drills into a folder. Outside of an
 * import literal the provider returns no suggestions, so it never competes with
 * Monaco's built-in word-based completions.
 */
export function registerSolidityImportCompletions(monaco: Monaco): void {
  monaco.languages.registerCompletionItemProvider('solidity', {
    triggerCharacters: ['"', '/'],
    provideCompletionItems(model: MonacoTextModel, position: MonacoPosition) {
      const lineText = model.getLineContent(position.lineNumber)
      const beforeCursor = lineText.slice(0, position.column - 1)

      const literal = activeImportLiteral(beforeCursor)
      if (literal === null) return { suggestions: [] }

      const word = model.getWordUntilPosition(position)
      // The replacement range covers the partial path the user has typed inside the
      // literal, so accepting a suggestion overwrites that segment rather than
      // appending to it.
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      // Filter paths that start with what's already typed inside the literal.
      const lowerPrefix = literal.toLowerCase()
      const matches = STDLIB_PATHS.filter((p) => p.toLowerCase().startsWith(lowerPrefix))

      const suggestions = matches.map((path) => ({
        label: path,
        kind: monaco.languages.CompletionItemKind.File,
        insertText: path,
        range,
        // Sort by depth then alpha so shallower paths surface first.
        sortText: depthSortKey(path),
      }))

      return { suggestions }
    },
  })
}

/**
 * If the cursor is currently inside an unterminated `import "..."` literal on this
 * line, return whatever the user has typed inside the quotes (possibly empty).
 * Returns `null` if we're not in an import-string position.
 */
function activeImportLiteral(beforeCursor: string): string | null {
  const m = beforeCursor.match(/(?:^|\s)import\s+(?:\{[^}]*\}\s+from\s+)?["']([^"']*)$/)
  return m ? m[1] : null
}

function depthSortKey(path: string): string {
  const depth = (path.match(/\//g) ?? []).length.toString().padStart(2, '0')
  return `${depth}-${path}`
}
