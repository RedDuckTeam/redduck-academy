import type { Abi, AbiFunction, AbiParameter } from 'viem'

export interface ResolvedType {
  abiType: string
  parameter?: AbiParameter
  /** Human label like `amount: uint256` (best-effort). */
  label: string
}

interface FormReader {
  /** Function name of the step the value-field path is rooted in. */
  readonly stepFunctionName?: string
}

/**
 * Given the value-field's `path`, the active ABI, and the function name of the
 * step containing this path, return the AbiParameter the value should conform to.
 *
 * Supported path shapes:
 *   `solidityConstructorArgs.<i>.value`                              → constructor input #i
 *   `solidityTestCases.<i>.steps.<k>.args.<j>.value`                 → step k's fn input #j
 *   `solidityTestCases.<i>.steps.<k>.expected`                       → step k's fn return type
 */
export function resolveTypeForPath(path: string, abi: Abi | undefined, form: FormReader): ResolvedType | null {
  if (!abi) return null

  const ctorMatch = path.match(/^solidityConstructorArgs\.(\d+)\.value$/)
  if (ctorMatch) {
    const idx = Number(ctorMatch[1])
    const ctor = abi.find((item): item is Extract<Abi[number], { type: 'constructor' }> => item.type === 'constructor')
    return paramAt(ctor?.inputs, idx)
  }

  const stepArgMatch = path.match(/^solidityTestCases\.(\d+)\.steps\.(\d+)\.args\.(\d+)\.value$/)
  if (stepArgMatch) {
    const idx = Number(stepArgMatch[3])
    const fn = findFunction(abi, form.stepFunctionName)
    return paramAt(fn?.inputs, idx)
  }

  const stepExpectedMatch = path.match(/^solidityTestCases\.(\d+)\.steps\.(\d+)\.expected$/)
  if (stepExpectedMatch) {
    const fn = findFunction(abi, form.stepFunctionName)
    if (!fn || !fn.outputs || fn.outputs.length === 0) return null
    if (fn.outputs.length === 1) return paramFor(fn.outputs[0])
    const tupleType = `(${fn.outputs.map((o) => o.type).join(',')})`
    return { abiType: tupleType, label: tupleType }
  }

  return null
}

function findFunction(abi: Abi, name: string | undefined): AbiFunction | undefined {
  if (!name) return undefined
  return abi.find((item): item is AbiFunction => item.type === 'function' && item.name === name)
}

function paramAt(inputs: readonly AbiParameter[] | undefined, idx: number): ResolvedType | null {
  if (!inputs || idx < 0 || idx >= inputs.length) return null
  return paramFor(inputs[idx])
}

function paramFor(p: AbiParameter): ResolvedType {
  const name = p.name && p.name.trim() !== '' ? p.name : undefined
  return {
    abiType: p.type,
    parameter: p,
    label: name ? `${name}: ${p.type}` : p.type,
  }
}
