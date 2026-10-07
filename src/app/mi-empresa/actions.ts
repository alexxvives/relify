"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyCopy } from "@/lib/company-copy";
import { isValidSpanishCif, normalizeCif } from "@/lib/spanish-cif";
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
import { publishSellerProject } from "@/server/publishSellerProject";
import { saveCompanyDraft } from "@/server/saveCompanyDraft";
import { addSellerCompany, deleteSellerCompany, selectSellerCompany } from "@/server/sellerCompany";

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
    customerBase: readText(formData, "customerBase"),
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

  const cif = normalizeCif(readText(formData, "cif"));

  if (cif.length > 0 && !isValidSpanishCif(cif)) {
    return { message: companyCopy.nifInvalid, saved: false };
  }

  const result = await saveCompanyDraft(user, input, cif);

  if (!result.ok) {
    return { message: result.message, saved: false };
  }

  revalidatePath("/mi-empresa");
  revalidatePath("/mi-empresa/detalles");
  return { message: companyCopy.saved, saved: true };
}

export type SellerPublishState = { ok: true } | { ok: false; message: string } | null;

export async function publishSellerProjectAction(
  state: SellerPublishState,
  formData: FormData,
): Promise<SellerPublishState> {
  void state;
  void formData;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded || user.role !== "seller") {
    redirect("/mi-empresa");
  }

  const result = await publishSellerProject(user);

  if ("url" in result) {
    if (!result.ok) {
      return result;
    }

    redirect(result.url);
  }

  if (result.ok) {
    revalidatePath("/mi-empresa");
    revalidatePath("/mi-empresa/detalles");
    revalidatePath("/proyectos");
    revalidatePath("/mercado");
  }

  return result;
}

function safeSellerPath(value: string): string {
  if (value === "/mi-empresa" || value.startsWith("/mi-empresa/")) {
    return value;
  }

  return "/mi-empresa";
}

function refreshSellerPages(): void {
  revalidatePath("/mi-empresa");
  revalidatePath("/mi-empresa/detalles");
  revalidatePath("/mi-empresa/documentos");
  revalidatePath("/mi-empresa/procesos");
  revalidatePath("/mi-empresa/servicios");
}

async function sellerUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded || user.role !== "seller") {
    redirect("/mi-empresa");
  }

  return user;
}

export async function selectSellerCompanyAction(formData: FormData): Promise<void> {
  const user = await sellerUser();
  const selected = await selectSellerCompany(user.id, readText(formData, "projectId"));
  refreshSellerPages();
  redirect(selected ? safeSellerPath(readText(formData, "next")) : "/mi-empresa");
}

export type SellerCompanyActionState = { ok: false; message: string } | null;

export async function addSellerCompanyAction(
  _state: SellerCompanyActionState,
  formData: FormData,
): Promise<SellerCompanyActionState> {
  const user = await sellerUser();
  const result = await addSellerCompany(user, readText(formData, "cif"));

  if (!result.ok) {
    return result;
  }

  refreshSellerPages();
  redirect("/mi-empresa/detalles");
}

export async function deleteSellerCompanyAction(formData: FormData): Promise<void> {
  const user = await sellerUser();
  await deleteSellerCompany(user, readText(formData, "projectId"));
  refreshSellerPages();
  redirect(safeSellerPath(readText(formData, "next")));
}
