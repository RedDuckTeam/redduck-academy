import { and, ilike, or } from 'drizzle-orm'
import type { AnyColumn, SQL } from 'drizzle-orm'

export function buildSearchFilter(search: string | undefined, columns: AnyColumn[]): SQL | undefined {
  if (!search) return undefined
  return or(...columns.map((col) => ilike(col, `%${search}%`)))
}

/** Combines conditions with AND, ignoring any undefined entries. */
export function buildWhereClause(...conditions: (SQL | undefined)[]): SQL | undefined {
  return and(...conditions)
}
