import { z } from "zod";
import { investorTypes } from "./investor-copy";

export const investorStakes = ["Completa", "Mayoría", "Minoría", "Flexible"] as const;

export const investorTicketBands = [
  "Menos de 500 mil €",
  "Entre 500 mil y 1 millón",
  "Entre 1 y 3 millones",
  "Más de 3 millones",
] as const;

/** A normal profile photo. The data URL is larger than the file because of base64. */
export const investorPhotoMaxBytes = 5 * 1024 * 1024;
export const investorPhotoMaxChars = 8 * 1024 * 1024;

export const investorPhotoSchema = z
  .string()
  .max(investorPhotoMaxChars)
  .refine((value) => value.length === 0 || value.startsWith("/") || value.startsWith("data:image/"), {
    message: "La foto tiene que ser una imagen.",
  });

export const investorProfileSchema = z.object({
  photo: investorPhotoSchema,
  city: z.string().trim().min(1).max(80),
  province: z.string().trim().min(1).max(80),
  investorType: z.enum(investorTypes),
  ticket: z.enum(investorTicketBands),
  sectors: z.string().trim().min(1).max(160),
  thesis: z.string().trim().min(1).max(600),
  contribution: z.string().trim().min(1).max(400),
  stake: z.enum(investorStakes),
});

export type InvestorProfileInput = z.infer<typeof investorProfileSchema>;

/**
 * S26: the /cuenta autosave stores what is filled so far (every column defaults to ""), so a sector added
 * with Enter is kept even before the rest of the profile is complete. Completeness is still judged by
 * `investorProfileIsComplete`, and the explicit form submit keeps the strict schema above.
 */
export const investorProfileDraftSchema = z.object({
  photo: investorPhotoSchema,
  city: z.string().trim().max(80),
  province: z.string().trim().max(80),
  investorType: z.union([z.enum(investorTypes), z.literal("")]),
  ticket: z.union([z.enum(investorTicketBands), z.literal("")]),
  sectors: z.string().trim().max(160),
  thesis: z.string().trim().max(600),
  contribution: z.string().trim().max(400),
  stake: z.union([z.enum(investorStakes), z.literal("")]),
});

export type InvestorProfileDraftInput = z.infer<typeof investorProfileDraftSchema>;
