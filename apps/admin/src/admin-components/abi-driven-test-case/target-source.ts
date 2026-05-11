/**
 * For a value-field path inside a Solidity test-case step, resolve the (source,
 * contractName) tuple that should be compiled to obtain the right ABI for
 * `functionName` / `args` / `expected` widgets on that step.
 *
 * Path patterns:
 *   `solidityTestCases.<i>.steps.<j>.functionName`
 *   `solidityTestCases.<i>.steps.<j>.args.<k>.value`
 *   `solidityTestCases.<i>.steps.<j>.expected`
 *
 * For each, we read the sibling `target` field at `solidityTestCases.<i>.steps.<j>.target`.
 * If it's blank or `@self`, fall back to the lesson's starterCode + solidityContractName.
 * If it's `@<alias>`, walk `solidityFixtures.*.alias` form fields to find the matching
 * row and return that fixture's source + contractName.
 *
 * Returns `null` when the path isn't inside a step (e.g. constructor args field).
 */
export interface TargetSource {
  source: string | undefined
  contractName: string | undefined
}

export function resolveTargetSource(
  path: string,
  fields: Record<string, unknown>,
): TargetSource | null {
  const stepMatch = path.match(/^(solidityTestCases\.\d+\.steps\.\d+)\./)
  if (!stepMatch) return null
  const stepPath = stepMatch[1]
  const target = readString(fields, `${stepPath}.target`)?.trim()
  const normalized = !target || target === '' ? '@self' : target

  if (normalized === '@self' || normalized.toLowerCase() === '@self') {
    return {
      source: readString(fields, 'starterCode'),
      contractName: readString(fields, 'solidityContractName'),
    }
  }
  if (!normalized.startsWith('@')) return { source: undefined, contractName: undefined }
  const alias = normalized.slice(1).toLowerCase()

  // Walk solidityFixtures.<i>.alias entries; on match, return that fixture's source.
  for (const key of Object.keys(fields)) {
    const m = key.match(/^solidityFixtures\.(\d+)\.alias$/)
    if (!m) continue
    const value = readString(fields, key)
    if (!value || value.toLowerCase() !== alias) continue
    const idx = m[1]
    return {
      source: readString(fields, `solidityFixtures.${idx}.source`),
      contractName: readString(fields, `solidityFixtures.${idx}.contractName`),
    }
  }
  return { source: undefined, contractName: undefined }
}

function readString(fields: Record<string, unknown>, key: string): string | undefined {
  const f = fields[key]
  if (!f) return undefined
  const v = (f as { value?: unknown }).value
  return typeof v === 'string' && v.length > 0 ? v : undefined
}
