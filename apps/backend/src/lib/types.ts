/**
 * Variables the auth middlewares publish. All three are absent on a route guarded by
 * `optionalAuth` when the caller offered no token, so read them defensively there.
 */
export type AuthVariables = {
  user: { id: string }
  idToken: string
  privyUserId: string
}
