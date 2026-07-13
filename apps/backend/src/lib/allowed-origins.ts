function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`)
}

export function parseAllowedOrigins(value: string): string[] {
  return value.split(',').map((o) => o.trim()).filter(Boolean)
}

export function isAllowedOrigin(origin: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) =>
    pattern.includes('*') ? patternToRegExp(pattern).test(origin) : origin === pattern,
  )
}
