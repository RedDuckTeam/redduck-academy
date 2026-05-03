/// <reference lib="webworker" />
import { compile } from '@redduck/solc-utils'
import type { Abi } from 'viem'

export type CompileWorkerRequest = { type: 'compile'; source: string; contractName?: string }
export type CompileWorkerResponse =
  | { type: 'ok'; abi: Abi; bytecode: `0x${string}`; contractName: string | null }
  | { type: 'error'; message: string }

self.onmessage = async (event: MessageEvent<CompileWorkerRequest>) => {
  const msg = event.data
  if (msg?.type !== 'compile') return
  try {
    const result = await compile(msg.source, msg.contractName)
    ;(self as unknown as Worker).postMessage({
      type: 'ok',
      abi: result.abi,
      bytecode: result.bytecode,
      contractName: msg.contractName ?? null,
    } satisfies CompileWorkerResponse)
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    } satisfies CompileWorkerResponse)
  }
}
