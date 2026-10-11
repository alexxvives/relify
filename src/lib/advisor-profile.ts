import * as z from "zod";
import { advisorCopy } from "./advisor-copy";
import { advisorSectors, type AdvisorSectorId } from "./advisor-sectors";
import { isValidSpanishCif } from "./spanish-cif";

export const advisorServiceIds = [
  "DUE_DILIGENCE",
  "BUSINESS_PLAN",
  "COMPANY_VALUATION",
  "LEGAL_CONSULTING",
  "LABOR_CONSULTING",
  "TAX_CONSULTING",
] as const;

export type AdvisorServiceId = (typeof advisorServiceIds)[number];

const sectorIdSchema = z.string().refine((id): id is AdvisorSectorId => advisorSectors.some((sector) => sector.id === id));

const euroField = z
  .string()
  .trim()
  .regex(/^\d+$/, advisorCopy.priceDigits)
  .refine((value) => {
    const amount = Number(value);
    return amount >= 0 && amount <= 1_000_000;
  }, advisorCopy.priceRange);

export const corporateInputSchema = z.object({
  businessName: z.string().trim().min(3, advisorCopy.businessNameRequired).max(120, advisorCopy.businessNameRequired),
  nif: z
    .string()
    .trim()
    .min(1, advisorCopy.nifRequired)
    .refine((value) => isValidSpanishCif(value), advisorCopy.nifInvalid),
  postalCode: z.string().trim().regex(/^\d{5}$/, advisorCopy.postalInvalid),
  description: z.string().trim().min(50, advisorCopy.descriptionShort).max(1000, advisorCopy.descriptionLong),
  sectors: z.array(sectorIdSchema).min(1, advisorCopy.sectorRequired),
});

export type CorporateInput = z.infer<typeof corporateInputSchema>;

export const serviceOfferSchema = z
  .object({
    serviceType: z.enum(advisorServiceIds),
    priceFrom: euroField,
    priceTo: euroField,
  })
  .refine((offer) => Number(offer.priceFrom) <= Number(offer.priceTo), {
    message: advisorCopy.priceOrder,
    path: ["priceTo"],
  });

export const servicesInputSchema = z.array(serviceOfferSchema).min(1, advisorCopy.serviceRequired);

export type ServiceOfferInput = z.infer<typeof serviceOfferSchema>;

const dealMoney = z
  .string()
  .trim()
  .regex(/^\d+$/, advisorCopy.priceDigits)
  .refine((value) => Number(value) <= 1_000_000_000, advisorCopy.priceDigits);

export const closedOperationSchema = z.object({
  name: z.string().trim().min(1, advisorCopy.dealNameRequired).max(120, advisorCopy.dealNameRequired),
  closingDate: z.string().trim().min(1, advisorCopy.priceRequired).max(20),
  sectorId: sectorIdSchema,
  revenue: dealMoney,
  ebitda: dealMoney,
  enterpriseValue: dealMoney,
});

export const dealsInputSchema = z
  .object({
    hasClosedOperations: z.boolean(),
    operations: z.array(closedOperationSchema),
  })
  .superRefine((value, context) => {
    if (value.hasClosedOperations && value.operations.length === 0) {
      context.addIssue({ code: "custom", message: advisorCopy.dealRequired, path: ["operations"] });
    }
  });

export type DealsInput = z.infer<typeof dealsInputSchema>;

export type StoredService = {
  serviceType: AdvisorServiceId;
  priceFromCents: number;
  priceToCents: number;
};

export type StoredOperation = {
  name: string;
  closingDate: string;
  sectorId: AdvisorSectorId;
  revenueCents: number;
  ebitdaCents: number;
  enterpriseValueCents: number;
};

export type AdvisorProfileView = {
  businessName: string;
  nif: string;
  postalCode: string;
  description: string;
  sectors: AdvisorSectorId[];
  services: StoredService[];
  operations: StoredOperation[];
  dealsAnswered: boolean;
  corporateComplete: boolean;
};

const storedServiceSchema = z.object({
  serviceType: z.enum(advisorServiceIds),
  priceFromCents: z.number().int().nonnegative(),
  priceToCents: z.number().int().nonnegative(),
});

const storedOperationSchema = z.object({
  name: z.string(),
  closingDate: z.string(),
  sectorId: sectorIdSchema,
  revenueCents: z.number().int().nonnegative(),
  ebitdaCents: z.number().int().nonnegative(),
  enterpriseValueCents: z.number().int().nonnegative(),
});

export function eurosToCents(euros: string): number {
  return Number(euros) * 100;
}

export function centsToEuroInput(cents: number): string {
  return String(Math.round(cents / 100));
}

export function formatAdvisorEuros(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function readStoredServices(value: unknown): StoredService[] {
  const parsed = z.array(storedServiceSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function readStoredOperations(value: unknown): StoredOperation[] {
  const parsed = z.array(storedOperationSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export type AdvisorProfileChecks = {
  identity: boolean;
  description: boolean;
  sectors: boolean;
  services: boolean;
};

export function advisorProfileChecks(profile: {
  businessName: string;
  nif: string;
  postalCode: string;
  description: string;
  sectors: string[];
  services: readonly unknown[];
}): AdvisorProfileChecks {
  const parsed = corporateInputSchema.safeParse(profile);
  const failed = new Set(parsed.success ? [] : parsed.error.issues.map((issue) => String(issue.path[0])));

  return {
    identity: !failed.has("businessName") && !failed.has("nif") && !failed.has("postalCode"),
    description: !failed.has("description"),
    sectors: !failed.has("sectors"),
    services: profile.services.length > 0,
  };
}

export function corporateIsComplete(profile: {
  businessName: string;
  nif: string;
  postalCode: string;
  description: string;
  sectors: string[];
}): boolean {
  return corporateInputSchema.safeParse(profile).success;
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? advisorCopy.saveFailed;
}

export function blankAdvisorProfile(): AdvisorProfileView {
  return {
    businessName: "",
    nif: "",
    postalCode: "",
    description: "",
    sectors: [],
    services: [],
    operations: [],
    dealsAnswered: false,
    corporateComplete: false,
  };
}
