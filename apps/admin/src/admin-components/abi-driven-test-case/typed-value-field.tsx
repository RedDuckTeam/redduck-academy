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
  const functionName = blockPath ? readString(fields, `${blockPath}.functionName`) : undefined
  const postCheckFunctionName = blockPath ? readString(fields, `${blockPath}.postCheckFunctionName`) : undefined

  const resolved = resolveTypeForPath(path, abi, { functionName, postCheckFunctionName })

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
 *   `solidityTestCases.0.args.2.value`       → `solidityTestCases.0`
 *   `solidityTestCases.0.expected`           → `solidityTestCases.0`
 *   `solidityTestCases.0.postCheckArgs.1.value` → `solidityTestCases.0`
 *   `solidityConstructorArgs.0.value`        → `null` (no per-block fn)
 */
function parentBlockPath(path: string): string | null {
  const m = path.match(/^(solidityTestCases\.\d+)\./)
  return m ? m[1] : null
}

function labelFromPath(path: string): string {
  const parts = path.split('.')
  return parts[parts.length - 1] ?? path
}
