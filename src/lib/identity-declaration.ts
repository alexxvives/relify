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
