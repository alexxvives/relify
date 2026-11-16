/** Better Auth HTTP routes closed so sign-up, sign-in and reset go through throttled server actions. */
export const authDisabledHttpPaths = [
  "/sign-up/email",
  "/sign-in/email",
  "/request-password-reset",
  "/reset-password",
  "/send-verification-email",
] as const;
