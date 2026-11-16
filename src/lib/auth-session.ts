/**
 * Stateful Postgres sessions. Better Auth cookieCache keeps a signed
 * session_data snapshot and skips the session table until maxAge, so a
 * replayed cookie still authenticates after logout deletes the row.
 * Protected routes and /get-session must read the adapter, not that cache.
 */
export const authSessionOptions = {
  freshAge: 60 * 60 * 24 * 30,
  cookieCache: {
    enabled: false,
  },
} as const;

export const authoritativeSessionQuery = {
  disableCookieCache: true,
} as const;
