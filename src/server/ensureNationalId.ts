import { nationalIdSchema } from "@/lib/auth-input";
import { normalizeCif } from "@/lib/spanish-cif";
import { prisma } from "@/server/db";

export const nationalIdCopy = {
  required: "Indica tu DNI o NIE: aparece en el documento firmado.",
  invalid: "Revisa el DNI o NIE: el formato o la letra no son válidos.",
} as const;

/**
 * Signed documents name the signer with their DNI/NIE. Older accounts may not have one:
 * the signing form then sends `nationalId`, which is validated and saved here.
 * Returns an error message, or null when the account has a valid id.
 */
export async function ensureNationalId(userId: string, value: FormDataEntryValue | null): Promise<string | null> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { nationalId: true } });

  if (row?.nationalId) {
    return null;
  }

  const parsed = nationalIdSchema.safeParse(typeof value === "string" ? value : "");
  if (!parsed.success) {
    return parsed.error.issues[0]?.message === "invalid" ? nationalIdCopy.invalid : nationalIdCopy.required;
  }

  await prisma.user.update({ where: { id: userId }, data: { nationalId: normalizeCif(parsed.data) } });
  return null;
}
