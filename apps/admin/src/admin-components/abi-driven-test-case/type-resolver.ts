import type { Abi, AbiFunction, AbiParameter } from 'viem'

export interface ResolvedType {
  abiType: string
  parameter?: AbiParameter
  /** Human label like `amount: uint256` (best-effort). */
  label: string
}

interface FormReader {
  readonly functionName?: string
  readonly postCheckFunctionName?: string
}

/**
 * Given the value-field's `path`, the active ABI, and a reader for sibling form fields,
 * return the AbiParameter the value should conform to.
 *
 * Supported path shapes:
 *   `solidityConstructorArgs.<i>.value`                          → constructor input #i
 *   `solidityTestCases.<i>.args.<j>.value`                       → main fn input #j
 *   `solidityTestCases.<i>.postCheckArgs.<j>.value`              → post-check fn input #j
 *   `solidityTestCases.<i>.expected`                             → main fn (or post-check fn) return
 */
export function resolveTypeForPath(path: string, abi: Abi | undefined, form: FormReader): ResolvedType | null {
  if (!abi) return null

  const ctorMatch = path.match(/^solidityConstructorArgs\.(\d+)\.value$/)
  if (ctorMatch) {
    const idx = Number(ctorMatch[1])
    const ctor = abi.find((item): item is Extract<Abi[number], { type: 'constructor' }> => item.type === 'constructor')
    return paramAt(ctor?.inputs, idx)
  }

  const argMatch = path.match(/^solidityTestCases\.(\d+)\.(args|postCheckArgs)\.(\d+)\.value$/)
  if (argMatch) {
    const argsField = argMatch[2] as 'args' | 'postCheckArgs'
    const idx = Number(argMatch[3])
    const fnName = argsField === 'args' ? form.functionName : form.postCheckFunctionName
    const fn = findFunction(abi, fnName)
    return paramAt(fn?.inputs, idx)
  }

  const expectedMatch = path.match(/^solidityTestCases\.(\d+)\.expected$/)
  if (expectedMatch) {
    // For postCheck blocks, the expected refers to the post-check fn's return.
    // Otherwise it's the main fn's return.
    const fnName = form.postCheckFunctionName || form.functionName
    const fn = findFunction(abi, fnName)
    if (!fn || !fn.outputs || fn.outputs.length === 0) return null
    if (fn.outputs.length === 1) return paramFor(fn.outputs[0])
    // Multiple outputs — represent as a tuple with comma types
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
