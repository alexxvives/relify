"use server";

import { revalidatePath } from "next/cache";
import { advisorCopy } from "@/lib/advisor-copy";
import {
  identityInputSchema,
  marketplaceInputSchema,
  dealsInputSchema,
  firstIssue,
  servicesInputSchema,
} from "@/lib/advisor-profile";
import { deleteAdvisorDocument, storeAdvisorDocument } from "@/lib/server/advisor-documents";
import { getCurrentUser } from "@/lib/server/get-current-user";
import {
  saveAdvisorCorporate,
  saveAdvisorDeals,
  saveAdvisorMarketplace,
  saveAdvisorServices,
  type AdvisorSaveResult,
} from "@/lib/server/save-advisor-profile";

async function advisorUserId(): Promise<string | AdvisorSaveResult> {
  const user = await getCurrentUser();

  if (!user || !user.onboarded || user.role !== "advisor") {
    return { ok: false, message: advisorCopy.forbidden };
  }

  return user.id;
}

function refreshAdvisor() {
  revalidatePath("/mis-servicios");
  revalidatePath("/inicio");
}

export async function saveCorporateAction(input: unknown): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = identityInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await saveAdvisorCorporate(userId, parsed.data);
  if (result.ok) {
    refreshAdvisor();
  }

  return result;
}

export async function saveMarketplaceAction(input: unknown): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = marketplaceInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await saveAdvisorMarketplace(userId, parsed.data);
  if (result.ok) {
    refreshAdvisor();
  }

  return result;
}

export async function saveServicesAction(input: unknown): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = servicesInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await saveAdvisorServices(userId, parsed.data);
  if (result.ok) {
    refreshAdvisor();
  }

  return result;
}

export async function saveDealsAction(input: unknown): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = dealsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await saveAdvisorDeals(userId, parsed.data);
  if (result.ok) {
    refreshAdvisor();
  }

  return result;
}

export async function storeAdvisorDocumentAction(formData: FormData): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const upload = formData.get("file");

  if (!(upload instanceof File)) {
    return { ok: false, message: advisorCopy.documentInvalid };
  }

  const result = await storeAdvisorDocument(userId, upload.name, new Uint8Array(await upload.arrayBuffer()));

  if (result.ok) {
    revalidatePath("/mis-servicios");
  }

  return result;
}

export async function deleteAdvisorDocumentAction(id: string): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const result = await deleteAdvisorDocument(userId, id);

  if (result.ok) {
    revalidatePath("/mis-servicios");
  }

  return result;
}
