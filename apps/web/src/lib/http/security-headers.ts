// Conservative security headers applied to every document response. These deliberately do
// NOT restrict script/style/connect/img/font sources, so wallet SDKs, Privy, RPC calls,
// fonts, and images keep working. A full `script-src`/`style-src` policy needs an inventory
// of every external origin plus nonces, and is a separate hardening pass.
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

/** Set the security headers above on a response, ignoring responses whose headers are immutable. */
export function addSecurityHeaders(response: Response): void {
  try {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value)
  } catch {
    // immutable headers (e.g. static asset passthrough) — nothing to do
  }
}
