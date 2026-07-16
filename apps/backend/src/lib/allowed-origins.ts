function patternToRegExp(pattern: string): RegExp {
  // `*` matches a single label only (no dots), so a wildcard like `https://*.redduck.io`
  // cannot be stretched by an attacker into `https://redduck.io.evil.com`. Origins carry no
  // path, so this stays scoped to the host and port.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]*')
  return new RegExp(`^${escaped}$`)
}

export function parseAllowedOrigins(value: string): string[] {
  return value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

export function isAllowedOrigin(origin: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) =>
    pattern.includes('*') ? patternToRegExp(pattern).test(origin) : origin === pattern,
  )
}
