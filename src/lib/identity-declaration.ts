export const identityDeclarationField = "identityDeclared";

export function identityDeclared(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1" || value === "yes";
}
