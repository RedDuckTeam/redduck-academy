import { createEVM } from '@ethereumjs/evm'
import { type Address, hexToBytes, bytesToHex, createAddressFromString } from '@ethereumjs/util'
import {
  encodeFunctionData,
  decodeFunctionResult,
  encodeDeployData,
  type Abi,
  type AbiFunction,
} from 'viem'
import { coerceArgs, normalizeReturnValue } from './abi-coerce'

export const CALLER = createAddressFromString('0x000000000000000000000000000000000000c0de')
const GAS_LIMIT = 0xffffffn

type Evm = Awaited<ReturnType<typeof createEVM>>

export interface RunReturnInput {
  kind: 'returnAssertion'
  bytecode: `0x${string}`
  abi: Abi
  fnAbi: AbiFunction
  constructorArgs?: unknown[]
  args: unknown[]
  valueWei?: string
}

export interface RunPostCheckInput {
  kind: 'postCheckAssertion'
  bytecode: `0x${string}`
  abi: Abi
  fnAbi: AbiFunction
  postCheckFnAbi: AbiFunction
  constructorArgs?: unknown[]
  args: unknown[]
  postCheckArgs: unknown[]
  valueWei?: string
}

export type RunTestCaseInput = RunReturnInput | RunPostCheckInput

/**
 * Runs one Solidity test case and returns the value that should be compared to `expected`.
 * Each call gets a fresh EVM so state doesn't leak between cases.
 */
export async function runTestCase(input: RunTestCaseInput): Promise<unknown> {
  const evm = await createEVM()
  const address = await deploy(evm, input.bytecode, input.abi, input.constructorArgs)
  const mainReturn = await callMain(evm, address, input.fnAbi, input.args, input.valueWei)
  if (input.kind === 'postCheckAssertion') {
    return await callPostCheck(evm, address, input.postCheckFnAbi, input.postCheckArgs)
  }
  return mainReturn
}

async function deploy(
  evm: Evm,
  bytecode: `0x${string}`,
  abi: Abi,
  constructorArgs: unknown[] | undefined,
): Promise<Address> {
  const constructorAbi = abi.find((item) => item.type === 'constructor') as
    | { type: 'constructor'; inputs?: readonly { type: string }[] }
    | undefined
  const ctorInputs = constructorAbi?.inputs ?? []
  const coercedCtorArgs = constructorArgs ? coerceArgs(constructorArgs, ctorInputs) : []

  const deployData = encodeDeployData({
    abi: constructorAbi ? [constructorAbi as never] : [],
    bytecode,
    args: coercedCtorArgs as never,
  })

  const result = await evm.runCall({
    caller: CALLER,
    data: hexToBytes(deployData),
    gasLimit: GAS_LIMIT,
    skipBalance: true,
  })

  if (result.execResult.exceptionError) {
    throw new Error(`deploy reverted: ${result.execResult.exceptionError.error}`)
  }
  if (!result.createdAddress) throw new Error('deploy did not produce a contract address')
  return result.createdAddress as Address
}

async function callMain(
  evm: Evm,
  to: Address,
  fnAbi: AbiFunction,
  args: unknown[],
  valueWei: string | undefined,
): Promise<unknown> {
  const inputs = (fnAbi.inputs ?? []) as readonly { type: string }[]
  const coercedArgs = coerceArgs(args, inputs)
  const callData = encodeFunctionData({
    abi: [fnAbi],
    functionName: fnAbi.name,
    args: coercedArgs as never,
  })

  const result = await evm.runCall({
    caller: CALLER,
    to,
    data: hexToBytes(callData),
    gasLimit: GAS_LIMIT,
    value: valueWei ? BigInt(valueWei) : 0n,
    skipBalance: true,
  })

  if (result.execResult.exceptionError) {
    throw new Error(`call reverted: ${result.execResult.exceptionError.error}`)
  }

  if (!fnAbi.outputs || fnAbi.outputs.length === 0) return null
  const decoded = decodeFunctionResult({
    abi: [fnAbi],
    functionName: fnAbi.name,
    data: bytesToHex(result.execResult.returnValue) as `0x${string}`,
  })
  return normalizeReturnValue(decoded)
}

async function callPostCheck(
  evm: Evm,
  to: Address,
  postFn: AbiFunction,
  args: unknown[],
): Promise<unknown> {
  const inputs = (postFn.inputs ?? []) as readonly { type: string }[]
  const coercedArgs = coerceArgs(args, inputs)
  const callData = encodeFunctionData({
    abi: [postFn],
    functionName: postFn.name,
    args: coercedArgs as never,
  })

  const result = await evm.runCall({
    caller: CALLER,
    to,
    data: hexToBytes(callData),
    gasLimit: GAS_LIMIT,
    skipBalance: true,
    isStatic: true,
  })

  if (result.execResult.exceptionError) {
    throw new Error(`post-check reverted: ${result.execResult.exceptionError.error}`)
  }

  if (!postFn.outputs || postFn.outputs.length === 0) return null
  const decoded = decodeFunctionResult({
    abi: [postFn],
    functionName: postFn.name,
    data: bytesToHex(result.execResult.returnValue) as `0x${string}`,
  })
  return normalizeReturnValue(decoded)
}
