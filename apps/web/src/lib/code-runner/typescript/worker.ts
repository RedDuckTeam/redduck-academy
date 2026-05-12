import { transform } from 'sucrase'

// Defense-in-depth: strip network and storage globals from the worker scope
// before any user-submitted code runs. Even though this is intended for trusted
// users, removing these closes the obvious "fetch the user's session against
// the API" channel from inside `new Function`-evaluated submissions.
;(function lockdownWorkerGlobals() {
  const toRemove = [
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'EventSource',
    'importScripts',
    'sendBeacon',
    'caches',
    'indexedDB',
    'navigator',
  ] as const
  for (const key of toRemove) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(self as any)[key] = undefined
    } catch {
      // ignore: some globals may be non-configurable in older runtimes
    }
  }
})()

export interface TsRunRequest {
  type: 'run'
  id: string
  code: string
  functionName: string
  input: unknown
}

export interface TsRunResponse {
  type: 'result'
  id: string
  ok: boolean
  got?: unknown
  error?: string
}

let cachedFn: ((...args: unknown[]) => unknown) | null = null
let cachedKey: string | null = null

function compile(code: string, functionName: string): (...args: unknown[]) => unknown {
  const cacheKey = code + '\0' + functionName
  if (cacheKey === cachedKey && cachedFn) return cachedFn

  const transpiled = transform(code, {
    transforms: ['typescript', 'imports'],
    keepUnusedImports: true,
  }).code

  // Wrap the user's module so we can capture top-level declarations and exports.
  // `module.exports` is provided as a fresh object; common ESM-to-CJS patterns
  // produced by sucrase will assign there. Top-level `const fn = ...`, `function fn()`,
  // and `export function fn()` are all reachable via the lookup chain below.
  const wrapped = `(function(module, exports) {
      "use strict";
      ${transpiled}
      var __fn = (typeof ${functionName} !== 'undefined') ? ${functionName}
        : (module.exports && module.exports.${functionName})
        ? module.exports.${functionName}
        : (module.exports && module.exports.default && module.exports.default.${functionName})
        ? module.exports.default.${functionName}
        : (typeof module.exports === 'function') ? module.exports
        : null;
      return __fn;
    })`

  // eslint-disable-next-line no-new-func
  const factory = new Function('return ' + wrapped)() as (m: { exports: Record<string, unknown> }, e: Record<string, unknown>) => unknown
  const moduleObj = { exports: {} as Record<string, unknown> }
  const fn = factory(moduleObj, moduleObj.exports)
  if (typeof fn !== 'function') {
    throw new Error(`Function "${functionName}" was not found in your code. Make sure it is declared at the top level.`)
  }
  cachedFn = fn as (...args: unknown[]) => unknown
  cachedKey = cacheKey
  return cachedFn
}

self.onmessage = (event: MessageEvent<TsRunRequest>) => {
  const msg = event.data
  if (msg?.type !== 'run') return

  const respond = (resp: TsRunResponse) => (self as unknown as Worker).postMessage(resp)

  let fn: (...args: unknown[]) => unknown
  try {
    fn = compile(msg.code, msg.functionName)
  } catch (err) {
    respond({
      type: 'result',
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
    return
  }

  const args = Array.isArray(msg.input) ? msg.input : [msg.input]

  try {
    const got = fn(...args)
    if (got && typeof (got as { then?: unknown }).then === 'function') {
      ;(got as Promise<unknown>)
        .then((resolved) => respond({ type: 'result', id: msg.id, ok: true, got: resolved }))
        .catch((err) =>
          respond({
            type: 'result',
            id: msg.id,
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          }),
        )
      return
    }
    respond({ type: 'result', id: msg.id, ok: true, got })
  } catch (err) {
    respond({
      type: 'result',
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
