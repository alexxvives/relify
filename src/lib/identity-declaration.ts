export const identityDeclarationField = "identityDeclared";

export function identityDeclared(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1" || value === "yes";
}

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
