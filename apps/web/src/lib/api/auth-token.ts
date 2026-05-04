// Module-level holder for Privy's getAccessToken so the plain-TS Fetcher can grab a fresh
// token before each request. PrivyAuthBridge wires this up on mount; until then the holder
// returns null and requests go out without an Authorization header (which is correct: there's
// no logged-in user yet).
type TokenGetter = () => Promise<string | null>

let tokenGetter: TokenGetter | null = null

export const setAuthTokenGetter = (fn: TokenGetter | null) => {
  tokenGetter = fn
}

export const getAuthToken = async (): Promise<string | null> => {
  if (!tokenGetter) return null
  try {
    return await tokenGetter()
  } catch {
    return null
  }
}
