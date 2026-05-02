import type { Lesson } from '@/types/lesson'
import type { RunnerSpec } from '@/lib/code-runner'

const TS_FN_NAME_RE = /(?:function\s+)?([a-zA-Z_$][\w$]*)\s*\(/

export function extractTsFunctionName(signature: string): string | null {
  const match = signature.match(TS_FN_NAME_RE)
  return match?.[1] ?? null
}

function parseSolidityConstructorArgs(raw: string | null | undefined): unknown[] | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

/** Builds a runner spec from a lesson. Returns `null` when the lesson can't be executed. */
export function buildRunnerSpec(lesson: Lesson): RunnerSpec | null {
  if (!lesson.codingLanguage || !lesson.functionSignature) return null

  if (lesson.codingLanguage === 'typescript') {
    const fnName = extractTsFunctionName(lesson.functionSignature)
    return fnName ? { language: 'typescript', functionName: fnName } : null
  }

  if (lesson.codingLanguage === 'solidity') {
    return {
      language: 'solidity',
      contractName: lesson.solidityContractName ?? undefined,
      functionSignature: lesson.functionSignature,
      constructorArgs: parseSolidityConstructorArgs(lesson.solidityConstructorArgs),
    }
  }

  return null
}
