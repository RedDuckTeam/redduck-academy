import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'
import type { CodingLanguage } from '@/types/lesson'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CODING_LANGUAGES: CodingLanguage[] = ['typescript', 'solidity', 'rust']
