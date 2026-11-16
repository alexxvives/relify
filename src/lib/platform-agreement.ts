/**
 * S26: has this user really signed the Acuerdo con Relify?
 *
 * Round S22 (commit 55f7f5f) made /registro stamp `user.terms_accepted_at` when the Términos checkbox was ticked.
 * That is the same column the agreement dialog checks, so every account created since then skipped the signed
 * agreement. Sign-up no longer writes it. Accounts already stamped at sign-up (no signature, stamp within minutes
 * of creation) count as not signed, so they get the agreement on their next visit.
 */
export const signupStampWindowMs = 10 * 60 * 1000;

export function platformAgreementSigned(input: {
  termsAcceptedAt: Date | null;
  hasSignature: boolean;
  createdAt: Date;
}): boolean {
  if (input.termsAcceptedAt === null) {
    return false;
  }
  if (input.hasSignature) {
    return true;
  }
  // Older accounts and seeds accepted before signatures existed: keep them as signed.
  return input.termsAcceptedAt.getTime() - input.createdAt.getTime() > signupStampWindowMs;
}
