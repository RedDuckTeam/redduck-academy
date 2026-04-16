import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'
import type { CodingLanguage } from '@/types/lesson'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CODING_LANGUAGES: CodingLanguage[] = ['typescript', 'solidity', 'rust']

export const shortAddress = (address: string, start: number = 6, end: number = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`
}
