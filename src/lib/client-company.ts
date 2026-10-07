import * as z from "zod";
import { eurosToCents, projectSlug } from "./company-draft";
import { isValidSpanishCif } from "./spanish-cif";

const euroField = z
  .string()
  .trim()
  .regex(/^\d+(,\d{1,2})?$/)
  .refine((value) => eurosToCents(value) >= 0);

export const clientCompanySchema = z.object({
  legalName: z.string().trim().min(1).max(160),
  cif: z.string().trim().refine((value) => isValidSpanishCif(value)),
  address: z.string().trim().min(1).max(200),
  codename: z.string().trim().min(1).max(80),
  region: z.string().trim().min(1).max(80),
  revenue: euroField,
  ebitda: euroField,
  adjustedEbitda: euroField,
  askingPrice: euroField,
});

export type ClientCompanyInput = z.infer<typeof clientCompanySchema>;

export function clientCompanySlug(codename: string): string {
  return projectSlug(codename);
}
