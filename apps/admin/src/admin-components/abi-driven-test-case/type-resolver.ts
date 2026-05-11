import type { Abi, AbiFunction, AbiParameter } from 'viem'

export interface ResolvedType {
  abiType: string
  parameter?: AbiParameter
  /** Human label like `amount: uint256` (best-effort). */
  label: string
}

interface FormReader {
  /** Main fn name for the case-level args / expected of the existing two block types. */
  readonly functionName?: string
  /** Post-check fn name for postCheckAssertion and sequence(assertion=postCheck). */
  readonly postCheckFunctionName?: string
  /** Function name for the step the path is rooted in (sequence block only). */
  readonly stepFunctionName?: string
  /** Function name of the last step (sequence block, used when assertion=lastReturn). */
  readonly lastStepFunctionName?: string
  /** Sequence-block assertion mode, only used when resolving `expected`. */
  readonly assertion?: 'lastReturn' | 'postCheck'
}

/**
 * Given the value-field's `path`, the active ABI, and a reader for sibling form fields,
 * return the AbiParameter the value should conform to.
 *
 * Supported path shapes:
 *   `solidityConstructorArgs.<i>.value`                                  → constructor input #i
 *   `solidityTestCases.<i>.args.<j>.value`                               → main fn input #j
 *   `solidityTestCases.<i>.postCheckArgs.<j>.value`                      → post-check fn input #j
 *   `solidityTestCases.<i>.steps.<k>.args.<j>.value`                     → step k's fn input #j
 *   `solidityTestCases.<i>.expected`                                     → main fn / post-check fn /
 *                                                                          last-step fn return,
 *                                                                          depending on block type
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
    const fnName = pickExpectedFunctionName(form)
    const fn = findFunction(abi, fnName)
    if (!fn || !fn.outputs || fn.outputs.length === 0) return null
    if (fn.outputs.length === 1) return paramFor(fn.outputs[0])
    // Multiple outputs — represent as a tuple with comma types
    const tupleType = `(${fn.outputs.map((o) => o.type).join(',')})`
    return { abiType: tupleType, label: tupleType }
  }

  return null
}

/**
 * Decide which function's outputs `expected` is typed against. Sequence cases pick by
 * assertion; the two original block types fall back to the legacy postCheck-or-main heuristic.
 */
function pickExpectedFunctionName(form: FormReader): string | undefined {
  if (form.assertion === 'lastReturn') return form.lastStepFunctionName
  if (form.assertion === 'postCheck') return form.postCheckFunctionName
  // Legacy: a postCheckAssertion block has postCheckFunctionName set; everything else uses functionName.
  return form.postCheckFunctionName || form.functionName
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
