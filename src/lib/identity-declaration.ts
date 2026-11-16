/*
 * S29 (Alex): no "Declaro que los datos son míos y correctos" checkbox. Nothing stored or checked it beyond the form
 * gate; the signed Acuerdo con Relify carries that commitment ("Tus datos" clause) together with the signature.
 */

/** NDA collects or confirms DNI/NIE. LOI asks only when the profile has none. */
export type IdentityOnSign = "ask" | "confirm" | "skip";

export function identityOnSign(input: {
  nationalIdMissing: boolean;
  collectIdentity: boolean;
}): IdentityOnSign {
  if (input.nationalIdMissing) {
    return "ask";
  }
  if (input.collectIdentity) {
    return "confirm";
  }
  return "skip";
}

/** S29b: onboarding is the only place a DNI/NIE is typed for the Acuerdo con Relify. */
export const onboardingNationalIdPath = "/onboarding?paso=dni";

/**
 * S29b (Alex): the Acuerdo con Relify always signs with the DNI/NIE stored in onboarding. An onboarded account
 * that somehow has none (older or seeded rows) is sent back to onboarding to add it before the agreement.
 */
export function agreementNeedsNationalId(user: {
  onboarded: boolean;
  nationalIdMissing: boolean;
  termsAccepted: boolean;
  role: string | null;
}): boolean {
  return user.onboarded && user.nationalIdMissing && !user.termsAccepted && user.role !== "admin";
}
