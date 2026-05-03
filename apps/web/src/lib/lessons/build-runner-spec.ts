import type { Lesson } from '@/types/lesson'
import type { RunnerSpec } from '@/lib/code-runner'

const TS_FN_NAME_RE = /(?:function\s+)?([a-zA-Z_$][\w$]*)\s*\(/

export function extractTsFunctionName(signature: string): string | null {
  const match = signature.match(TS_FN_NAME_RE)
  return match?.[1] ?? null
}

/** Builds a runner spec from a lesson. Returns `null` when the lesson can't be executed. */
export function buildRunnerSpec(lesson: Lesson): RunnerSpec | null {
  if (!lesson.codingLanguage) return null

  if (lesson.codingLanguage === 'typescript') {
    if (!lesson.functionSignature) return null
    const fnName = extractTsFunctionName(lesson.functionSignature)
    return fnName ? { language: 'typescript', functionName: fnName } : null
  }

  if (lesson.codingLanguage === 'solidity') {
    return {
      language: 'solidity',
      contractName: lesson.solidityContractName ?? undefined,
      rawConstructorArgs: (lesson.solidityConstructorArgs ?? []).map((a) => a.value ?? ''),
    }
  }

  return null
}
