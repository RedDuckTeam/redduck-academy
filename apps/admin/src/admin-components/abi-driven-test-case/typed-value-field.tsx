'use client'

import { useField, useAllFormFields } from '@payloadcms/ui'
import type { Abi } from 'viem'
import { useCompiledAbi } from './use-compiled-abi'
import { resolveTypeForPath } from './type-resolver'
import { widgetForAbiType } from './widget-registry'
import { UintInput } from './widgets/uint-input'
import { IntInput } from './widgets/int-input'
import { BoolInput } from './widgets/bool-input'
import { AddressInput } from './widgets/address-input'
import { BytesInput } from './widgets/bytes-input'
import { StringInput } from './widgets/string-input'
import { ArrayInput } from './widgets/array-input'
import { JsonFallbackInput } from './widgets/json-fallback-input'

interface TypedValueFieldProps {
  path: string
}

/**
 * Custom Field for any text-typed value position in the Solidity test-case schema.
 * Resolves the AbiParameter type for `path` (using the lesson's compiled ABI plus
 * the parent block's `functionName`/`postCheckFunctionName`) and renders the matching
 * primitive widget. Falls back to a JSON-literal input when the ABI isn't ready.
 */
export function TypedValueField({ path }: TypedValueFieldProps) {
  const { value, setValue } = useField<string>({ path })
  const [fields] = useAllFormFields()

  const starterCode = readString(fields, 'starterCode')
  const solidityContractName = readString(fields, 'solidityContractName')
  const compileState = useCompiledAbi(starterCode, solidityContractName)
  const abi: Abi | undefined = compileState.status === 'ok' ? compileState.abi : undefined

  const blockPath = parentBlockPath(path)
  const stepPath = parentStepPath(path)
  const functionName = blockPath ? readString(fields, `${blockPath}.functionName`) : undefined
  const postCheckFunctionName = blockPath ? readString(fields, `${blockPath}.postCheckFunctionName`) : undefined
  const stepFunctionName = stepPath ? readString(fields, `${stepPath}.functionName`) : undefined
  const assertion = blockPath
    ? (readString(fields, `${blockPath}.assertion`) as 'lastReturn' | 'postCheck' | undefined)
    : undefined
  const lastStepFunctionName = blockPath ? readLastStepFunctionName(fields, blockPath) : undefined

  const resolved = resolveTypeForPath(path, abi, {
    functionName,
    postCheckFunctionName,
    stepFunctionName,
    lastStepFunctionName,
    assertion,
  })

  const stringValue = typeof value === 'string' ? value : ''
  const onChange = (next: string) => setValue(next)

  if (!resolved) {
    return <JsonFallbackInput label={labelFromPath(path)} value={stringValue} onChange={onChange} />
  }

  const kind = widgetForAbiType(resolved.abiType)
  const label = resolved.label

  switch (kind) {
    case 'uint':
      return <UintInput label={label} abiType={resolved.abiType} value={stringValue} onChange={onChange} />
    case 'int':
      return <IntInput label={label} abiType={resolved.abiType} value={stringValue} onChange={onChange} />
    case 'bool':
      return <BoolInput label={label} value={stringValue} onChange={onChange} />
    case 'address':
      return <AddressInput label={label} value={stringValue} onChange={onChange} />
    case 'bytes':
      return <BytesInput label={label} abiType={resolved.abiType} value={stringValue} onChange={onChange} />
    case 'string':
      return <StringInput label={label} value={stringValue} onChange={onChange} />
    case 'array':
      return <ArrayInput label={label} abiType={resolved.abiType} value={stringValue} onChange={onChange} />
    case 'json':
    default:
      return <JsonFallbackInput label={label} abiType={resolved.abiType} value={stringValue} onChange={onChange} />
  }
}

function readString(fields: Record<string, unknown>, key: string): string | undefined {
  const f = fields[key]
  if (!f) return undefined
  const v = (f as { value?: unknown }).value
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

/**
 * Given a value-field path, return the parent block / array-row path so siblings
 * (functionName, postCheckFunctionName) can be looked up.
 *
 *   `solidityTestCases.0.args.2.value`             → `solidityTestCases.0`
 *   `solidityTestCases.0.expected`                 → `solidityTestCases.0`
 *   `solidityTestCases.0.postCheckArgs.1.value`    → `solidityTestCases.0`
 *   `solidityTestCases.0.steps.1.args.0.value`     → `solidityTestCases.0`
 *   `solidityConstructorArgs.0.value`              → `null` (no per-block fn)
 */
function parentBlockPath(path: string): string | null {
  const m = path.match(/^(solidityTestCases\.\d+)\./)
  return m ? m[1] : null
}

/**
 * For a value-field inside a sequence step, return the step path so the step's own
 * `functionName` can be looked up. Returns `null` for paths outside a step.
 */
function parentStepPath(path: string): string | null {
  const m = path.match(/^(solidityTestCases\.\d+\.steps\.\d+)\./)
  return m ? m[1] : null
}

/**
 * Walk all form fields under `<blockPath>.steps.<i>.functionName` and return the
 * function name of the highest-indexed step. Used by the `expected` resolver to type
 * the assertion against the last step's return when `assertion=lastReturn`.
 */
function readLastStepFunctionName(fields: Record<string, unknown>, blockPath: string): string | undefined {
  const prefix = `${blockPath}.steps.`
  let highestIdx = -1
  let highestFnName: string | undefined
  for (const key of Object.keys(fields)) {
    if (!key.startsWith(prefix)) continue
    const rest = key.slice(prefix.length)
    const m = rest.match(/^(\d+)\.functionName$/)
    if (!m) continue
    const idx = Number(m[1])
    if (idx <= highestIdx) continue
    const value = readString(fields, key)
    if (!value) continue
    highestIdx = idx
    highestFnName = value
  }
  return highestFnName
}

function labelFromPath(path: string): string {
  const parts = path.split('.')
  return parts[parts.length - 1] ?? path
}
