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
