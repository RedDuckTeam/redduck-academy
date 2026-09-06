/** Variables `requireAuth` publishes; a route guarded by it always has all three. */
export type AuthVariables = {
  user: { id: string }
  idToken: string
  privyUserId: string
}

/** Variables `optionalAuth` publishes — absent when the caller offered no token. */
export type OptionalAuthVariables = Partial<AuthVariables>
