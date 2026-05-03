'use client'

import { useEffect, useState } from 'react'
import type { Abi } from 'viem'
import type { CompileWorkerRequest, CompileWorkerResponse } from './compile.worker'

export type CompileState =
  | { status: 'idle' }
  | { status: 'compiling' }
  | { status: 'ok'; abi: Abi; bytecode: `0x${string}`; contractName: string | null }
  | { status: 'error'; error: string }

interface CompileResult {
  abi: Abi
  bytecode: `0x${string}`
  contractName: string | null
}

const DEBOUNCE_MS = 400
const cache = new Map<string, Promise<CompileResult>>()

/**
 * Solc WASM is ~10MB, which exceeds the 8MB main-thread WebAssembly.Compile cap in
 * Chrome/Edge — so all compiles run in a dedicated worker. Cache by `(contract, source)`
 * so siblings rendering the same lesson share work.
 */
function compileInWorker(source: string, contractName: string | undefined): Promise<CompileResult> {
  const key = (contractName ?? '') + ' ' + source
  let promise = cache.get(key)
  if (!promise) {
    promise = new Promise<CompileResult>((resolve, reject) => {
      const worker = new Worker(new URL('./compile.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<CompileWorkerResponse>) => {
        const data = event.data
        worker.terminate()
        if (data.type === 'ok') {
          resolve({ abi: data.abi, bytecode: data.bytecode, contractName: data.contractName })
        } else {
          reject(new Error(data.message))
        }
      }
      worker.onerror = (event) => {
        worker.terminate()
        reject(new Error(event.message || 'compile worker crashed'))
      }
      const req: CompileWorkerRequest = { type: 'compile', source, contractName }
      worker.postMessage(req)
    }).catch((err) => {
      cache.delete(key)
      throw err
    })
    cache.set(key, promise)
  }
  return promise
}

/**
 * Compiles Solidity source in a worker, debounced. Returns a state machine the caller
 * can render. Memoized by `(contractName, source)` so siblings share work.
 */
export function useCompiledAbi(source: string | null | undefined, contractName?: string | null): CompileState {
  const [state, setState] = useState<CompileState>({ status: 'idle' })
  const trimmed = source?.trim() ?? ''
  const normalizedContract = contractName?.trim() || undefined

  useEffect(() => {
    if (!trimmed) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState((prev) => (prev.status === 'ok' ? prev : { status: 'compiling' }))
    const timer = setTimeout(() => {
      compileInWorker(trimmed, normalizedContract).then(
        (result) => {
          if (cancelled) return
          setState({
            status: 'ok',
            abi: result.abi,
            bytecode: result.bytecode,
            contractName: result.contractName,
          })
        },
        (err) => {
          if (cancelled) return
          setState({ status: 'error', error: err instanceof Error ? err.message : String(err) })
        },
      )
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed, normalizedContract])

  return state
}
