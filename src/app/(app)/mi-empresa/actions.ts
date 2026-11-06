"use server";

import { submitForReviewIfReady } from "@/server/submitForReview";
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
import { deleteProjectCover, writeProjectCover } from "@/server/projectCover";
import { addProjectPhotos, deleteProjectPhoto } from "@/server/projectPhotos";
import { publishSellerProject } from "@/server/publishSellerProject";
import { requestFigureCorrection } from "@/server/requestFigureCorrection";
import { requestIdentityChange } from "@/server/requestIdentityChange";
import { saveCompanyDraft } from "@/server/saveCompanyDraft";
import { saveEbitdaAdjustments, type SaveEbitdaAdjustmentsResult } from "@/server/saveEbitdaAdjustments";
import { storeAdjustmentDocument, type StoreAdjustmentDocumentResult } from "@/server/storeAdjustmentDocument";
import { activeSellerProjectId, addSellerCompany, deleteSellerCompany, selectSellerCompany } from "@/server/sellerCompany";
import { startListingCheckout } from "@/server/startCheckout";
import { uniqueCodename } from "@/server/uniqueCodename";

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
    saleReason: readText(formData, "saleReason"),
    principalCnae: readText(formData, "principalCnae"),
    secondaryCnaes: readList(formData, "secondaryCnae").filter((code) => code.trim() !== ""),
    revenue: readText(formData, "revenue"),
    ebitda: readText(formData, "ebitda"),
    adjustedEbitda: readText(formData, "adjustedEbitda"),
    ebitdaAdjustments: readText(formData, "ebitdaAdjustments"),
    askingPrice: readText(formData, "askingPrice"),
    sellerFinancing: readText(formData, "sellerFinancing"),
    sellerFinancingPct: readText(formData, "sellerFinancingPct"),
    sellerFinancingYears: readText(formData, "sellerFinancingYears"),
    sellerStay: readText(formData, "sellerStay"),
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

  // t75: no "Pedir publicación" step; a complete seller checklist submits itself.
  const activeId = await activeSellerProjectId(user.id);
  if (activeId) {
    await submitForReviewIfReady(user.id, activeId);
  }

  revalidatePath("/mi-empresa");
  revalidatePath("/mi-empresa/detalles");
  return { message: companyCopy.saved, saved: true };
}

/** t89: the EBITDA adjustments modal saves on its own, so the seller never leaves it with unsaved rows. */
export async function saveEbitdaAdjustmentsAction(raw: string): Promise<SaveEbitdaAdjustmentsResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/entrar");
  }
  const result = await saveEbitdaAdjustments(user, typeof raw === "string" ? raw.slice(0, 20000) : "");
  if (result.ok) {
    revalidatePath("/mi-empresa");
    revalidatePath("/mi-empresa/detalles");
  }
  return result;
}

function uploadedFile(value: FormDataEntryValue | null): { name: string; size: number; read: () => Promise<Uint8Array> } | null {
  if (!(value instanceof Blob) || !("name" in value) || typeof value.name !== "string" || value.name.length === 0) {
    return null;
  }
  const blob = value;
  return {
    name: value.name,
    size: blob.size,
    read: async () => new Uint8Array(await blob.arrayBuffer()),
  };
}

export async function storeAdjustmentDocumentAction(formData: FormData): Promise<StoreAdjustmentDocumentResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: companyCopy.adjustmentDocumentInvalid };
    }
    const file = uploadedFile(formData.get("file"));
    if (!file || file.size === 0) {
      return { ok: false, message: companyCopy.adjustmentDocumentInvalid };
    }
    return await storeAdjustmentDocument(user, file.name, await file.read());
  } catch {
    return { ok: false, message: companyCopy.adjustmentDocumentInvalid };
  }
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

  if (result.needsPayment) {
    const checkout = await startListingCheckout(user, result.projectId, "add");

    if (!checkout.ok) {
      return checkout;
    }

    redirect(checkout.url);
  }

  redirect("/mi-empresa/detalles");
}

export async function saveProjectCoverAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await sellerUser();
  const projectId = await activeSellerProjectId(user.id);
  const file = formData.get("cover");

  if (!projectId || !(file instanceof File)) {
    return { ok: false, message: companyCopy.cardPhotosType };
  }

  const saved = await writeProjectCover(projectId, file.type, new Uint8Array(await file.arrayBuffer()));

  if (!saved) {
    return { ok: false, message: file.size > 8 * 1024 * 1024 ? companyCopy.cardPhotosLarge : companyCopy.cardPhotosType };
  }

  refreshSellerPages();
  revalidatePath("/mercado");
  revalidatePath("/proyectos");
  return { ok: true };
}

export async function deleteProjectCoverAction(): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await sellerUser();
  const projectId = await activeSellerProjectId(user.id);

  if (!projectId) {
    return { ok: false, message: companyCopy.cardPhotosType };
  }

  await deleteProjectCover(projectId);
  refreshSellerPages();
  revalidatePath("/mercado");
  revalidatePath("/proyectos");
  return { ok: true };
}

/** t84: gallery photos for the ficha pública (several at once). */
export async function addProjectPhotosAction(formData: FormData): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await sellerUser();
  const projectId = await activeSellerProjectId(user.id);
  const files = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  if (!projectId || files.length === 0) {
    return { ok: false, message: companyCopy.cardPhotosType };
  }
  const result = await addProjectPhotos(projectId, await Promise.all(files.map(async (file) => ({ type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) }))));
  if (!result.ok) {
    return { ok: false, message: result.reason === "limit" ? companyCopy.galleryLimit : result.reason === "size" ? companyCopy.cardPhotosLarge : companyCopy.cardPhotosType };
  }
  refreshSellerPages();
  revalidatePath("/proyectos");
  revalidatePath("/mercado");
  return { ok: true };
}

export async function deleteProjectPhotoAction(photoId: string): Promise<{ ok: boolean }> {
  const user = await sellerUser();
  const projectId = await activeSellerProjectId(user.id);
  if (!projectId || typeof photoId !== "string") {
    return { ok: false };
  }
  const ok = await deleteProjectPhoto(projectId, photoId);
  refreshSellerPages();
  revalidatePath("/proyectos");
  revalidatePath("/mercado");
  return { ok };
}

export async function deleteSellerCompanyAction(formData: FormData): Promise<void> {
  const user = await sellerUser();
  await deleteSellerCompany(user, readText(formData, "projectId"));
  refreshSellerPages();
  redirect(safeSellerPath(readText(formData, "next")));
}

/** "Generar otro": a fresh free nickname for the seller's form. Saved with the rest of the draft. */
export async function generateCodenameAction(current: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    return current;
  }
  return uniqueCodename([current]);
}

export type FigureCorrectionState = { ok: boolean; message: string } | null;

/** t76: "Proponer corrección" on the read-only figures; emails the team, changes nothing. */
export async function requestFigureCorrectionAction(_state: FigureCorrectionState, formData: FormData): Promise<FigureCorrectionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const projectId = await activeSellerProjectId(user.id);
  if (!projectId) {
    return { ok: false, message: "Primero guarda los datos de tu empresa." };
  }

  const result = await requestFigureCorrection(user, projectId, readText(formData, "message"));
  return result.ok ? { ok: true, message: "Enviado. Revisaremos las cifras y te avisaremos al corregirlas." } : { ok: false, message: result.message };
}

export type IdentityChangeState = { ok: boolean; message: string } | null;

/** t79: "Solicitar cambio" on the locked legal name / NIF; emails info@, changes nothing. */
export async function requestIdentityChangeAction(_state: IdentityChangeState, formData: FormData): Promise<IdentityChangeState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const projectId = await activeSellerProjectId(user.id);
  if (!projectId) {
    return { ok: false, message: "Primero guarda los datos de tu empresa." };
  }

  const result = await requestIdentityChange(user, projectId, {
    field: readText(formData, "field"),
    current: readText(formData, "current"),
    correct: readText(formData, "correct"),
    reason: readText(formData, "reason"),
  });
  return result.ok ? { ok: true, message: "Solicitud enviada. Te escribiremos cuando lo revisemos." } : { ok: false, message: result.message };
}
