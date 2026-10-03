"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyCopy } from "@/lib/company-copy";
import {
  closedFieldName,
  companyDraftFieldMessage,
  companyDraftSchema,
  emptyClosedYear,
  emptyForecastYear,
  forecastFieldName,
  type ClosedYearInput,
  type CompanyDraftInput,
  type ForecastYearInput,
} from "@/lib/company-draft";
import { balanceInputKeys, pnlInputKeys } from "@/lib/company-profile";
import { getCurrentUser } from "@/server/getCurrentUser";
import { saveCompanyDraft } from "@/server/saveCompanyDraft";

export type CompanyDraftState = { message: string; saved: boolean } | null;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readList(formData: FormData, name: string): string[] {
  return formData.getAll(name).filter((value): value is string => typeof value === "string");
}

function readClosedYear(formData: FormData, index: number): ClosedYearInput {
  const year = emptyClosedYear("");
  year.year = readText(formData, closedFieldName(index, "year"));

  for (const key of pnlInputKeys) {
    year[key] = readText(formData, closedFieldName(index, key));
  }

  for (const key of balanceInputKeys) {
    year[key] = readText(formData, closedFieldName(index, key));
  }

  return year;
}

function readForecastYear(formData: FormData): ForecastYearInput {
  const year = emptyForecastYear("");
  year.year = readText(formData, forecastFieldName("year"));

  for (const key of pnlInputKeys) {
    year[key] = readText(formData, forecastFieldName(key));
  }

  return year;
}

function readCompanyDraft(formData: FormData): CompanyDraftInput | { message: string } {
  const headcount = readText(formData, "headcount");
  const parsed = companyDraftSchema.safeParse({
    legalName: readText(formData, "legalName"),
    address: readText(formData, "address"),
    codename: readText(formData, "codename"),
    region: readText(formData, "region"),
    foundedYear: readText(formData, "foundedYear"),
    description: readText(formData, "description"),
    principalCnae: readText(formData, "principalCnae"),
    secondaryCnaes: readList(formData, "secondaryCnae").filter((code) => code.trim() !== ""),
    revenue: readText(formData, "revenue"),
    ebitda: readText(formData, "ebitda"),
    adjustedEbitda: readText(formData, "adjustedEbitda"),
    askingPrice: readText(formData, "askingPrice"),
    opex: readText(formData, "opex"),
    capitalPercents: readList(formData, "capitalPercent"),
    productPercents: readList(formData, "productPercent"),
    clientPercents: readList(formData, "clientPercent"),
    headcount: headcount === "" ? "" : headcount,
    closedYears: [readClosedYear(formData, 0), readClosedYear(formData, 1), readClosedYear(formData, 2)],
    forecastYear: readForecastYear(formData),
  });

  if (!parsed.success) {
    return { message: companyDraftFieldMessage(parsed.error) };
  }

  return parsed.data;
}

export async function saveCompanyDraftAction(
  _state: CompanyDraftState,
  formData: FormData,
): Promise<CompanyDraftState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const input = readCompanyDraft(formData);

  if ("message" in input) {
    return { message: input.message, saved: false };
  }

  const result = await saveCompanyDraft(user, input);

  if (!result.ok) {
    return { message: result.message, saved: false };
  }

  revalidatePath("/mi-empresa");
  revalidatePath("/mi-empresa/detalles");
  return { message: companyCopy.saved, saved: true };
}
