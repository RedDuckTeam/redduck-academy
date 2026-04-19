import { AppError } from './errors'

export type PaginationInput = {
  page?: string | number | undefined
  pageSize?: string | number | undefined
}

export type Pagination = {
  page: number
  pageSize: number
  limit: number
  offset: number
}

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

function parsePositiveInt(raw: string | number | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isInteger(n)) {
    throw new AppError(400, 'page and pageSize must be integers')
  }
  return n
}

/** Parses 1-based `page` and `pageSize` from query strings. */
export function parsePaginationQuery(input: PaginationInput): Pagination {
  const page = parsePositiveInt(input.page, 1)
  const pageSize = parsePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE)

  if (page < 1) {
    throw new AppError(400, 'page must be at least 1')
  }
  if (pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new AppError(400, `pageSize must be between 1 and ${MAX_PAGE_SIZE}`)
  }

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}
