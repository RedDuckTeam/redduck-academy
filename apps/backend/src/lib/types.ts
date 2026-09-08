/** Variables `requireAuth` publishes; a route guarded by it always has all three. */
export type AuthVariables = {
  user: { id: string }
  idToken: string
  privyUserId: string
}
