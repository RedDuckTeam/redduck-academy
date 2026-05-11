'use client'

import { useField, useAllFormFields } from '@payloadcms/ui'
import type { Abi, AbiFunction, AbiStateMutability } from 'viem'
import { useCompiledAbi } from './use-compiled-abi'
import { resolveTargetSource } from './target-source'
import { WidgetShell } from './widgets/widget-shell'

export interface FunctionSelectBaseProps {
  path: string
  label: string
  description?: string
  /**
   * Optional state-mutability filter — used by the post-check variant to limit
   * choices to `view` / `pure` functions.
   */
  mutabilityFilter?: AbiStateMutability[]
}

/**
 * Renders a `<select>` populated by function names from the compiled ABI. Falls back
 * to a free-text input when the ABI isn't available yet.
 */
export function FunctionSelectBase({ path, label, description, mutabilityFilter }: FunctionSelectBaseProps) {
  const { value, setValue } = useField<string>({ path })
  const [fields] = useAllFormFields()

  // If this widget lives on a test-case step, the relevant ABI comes from the
  // step's `target` (defaults to the student's contract). Otherwise we're on the
  // global FunctionSelect or another non-step path — fall back to starterCode.
  const target = resolveTargetSource(path, fields)
  const source = target?.source ?? readString(fields, 'starterCode')
  const contractName = target?.contractName ?? readString(fields, 'solidityContractName')
  const compileState = useCompiledAbi(source, contractName)

  const stringValue = typeof value === 'string' ? value : ''
  const onChange = (next: string) => setValue(next)

  if (compileState.status === 'idle') {
    return (
      <WidgetShell
        label={label}
        description={description ?? 'Add starter Solidity code above to populate this dropdown.'}
      >
        <input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="functionName"
          style={inputStyle()}
        />
      </WidgetShell>
    )
  }

  if (compileState.status === 'compiling') {
    return (
      <WidgetShell label={label} description="Compiling…">
        <input type="text" value={stringValue} disabled style={inputStyle()} />
      </WidgetShell>
    )
  }

  if (compileState.status === 'error') {
    return (
      <WidgetShell label={label} description="Compile failed — check starter code." error={compileState.error}>
        <input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="functionName"
          style={inputStyle()}
        />
      </WidgetShell>
    )
  }

  const fns = listFunctions(compileState.abi, mutabilityFilter)
  if (fns.length === 0) {
    return (
      <WidgetShell label={label} description="No matching functions in the contract ABI.">
        <input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="functionName"
          style={inputStyle()}
        />
      </WidgetShell>
    )
  }

  return (
    <WidgetShell label={label} description={description}>
      <select value={stringValue} onChange={(e) => onChange(e.target.value)} style={inputStyle()}>
        <option value="">— select function —</option>
        {fns.map((fn) => (
          <option key={fn.name + signatureSuffix(fn)} value={fn.name}>
            {fn.name}
            {signatureSuffix(fn)}
          </option>
        ))}
      </select>
    </WidgetShell>
  )
}

function listFunctions(abi: Abi, mutabilityFilter?: AbiStateMutability[]): AbiFunction[] {
  return abi.filter((item): item is AbiFunction => {
    if (item.type !== 'function') return false
    if (!mutabilityFilter) return true
    return item.stateMutability !== undefined && mutabilityFilter.includes(item.stateMutability)
  })
}

function signatureSuffix(fn: AbiFunction): string {
  const inputs = (fn.inputs ?? []).map((i) => i.type).join(',')
  const outputs = (fn.outputs ?? []).map((o) => o.type).join(',')
  const mutability = fn.stateMutability ?? ''
  const parts = [`(${inputs})`]
  if (mutability) parts.push(mutability)
  if (outputs) parts.push(`→ (${outputs})`)
  return ' ' + parts.join(' ')
}

function readString(fields: Record<string, unknown>, key: string): string | undefined {
  const f = fields[key]
  if (!f) return undefined
  const v = (f as { value?: unknown }).value
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function inputStyle() {
  return {
    padding: '0.5rem 0.75rem',
    fontFamily: 'var(--font-mono, monospace)',
    border: '1px solid var(--theme-elevation-200, #ccc)',
    borderRadius: '4px',
    background: 'var(--theme-input-bg, #fff)',
    color: 'var(--theme-elevation-900, #111)',
  } as const
}
