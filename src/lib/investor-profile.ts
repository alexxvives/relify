import { z } from "zod";
import { investorTypes } from "./investor-copy";

export const investorTicketBands = [
  "Menos de 500 mil €",
  "Entre 500 mil y 1 millón",
  "Entre 1 y 3 millones",
  "Más de 3 millones",
] as const;

const photoSchema = z
  .string()
  .max(180_000)
  .refine((value) => value.length === 0 || value.startsWith("/") || value.startsWith("data:image/"), {
    message: "La foto tiene que ser una imagen.",
  });

export const investorProfileSchema = z.object({
  photo: photoSchema,
  city: z.string().trim().min(1).max(80),
  province: z.string().trim().min(1).max(80),
  investorType: z.enum(investorTypes),
  ticket: z.enum(investorTicketBands),
  sectors: z.string().trim().min(1).max(160),
  thesis: z.string().trim().min(1).max(600),
  contribution: z.string().trim().min(1).max(400),
});

export type InvestorProfileInput = z.infer<typeof investorProfileSchema>;
