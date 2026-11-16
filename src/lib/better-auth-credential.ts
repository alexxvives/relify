/**
 * Better Auth `signInEmail` (better-auth/dist/api/routes/sign-in.mjs) loads the
 * credential row with `providerId === "credential" && accountId === user.id`.
 * INT seeds that stored the email in `account.account_id` 401 before password verify.
 */
export function betterAuthCredentialAccountId(userId: string): string {
  return userId;
}
