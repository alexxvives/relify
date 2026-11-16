"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { billingCopy } from "@/lib/billing-copy";
import { clientCompanySchema } from "@/lib/client-company";
import { eurosToCents } from "@/lib/company-draft";
import { createClientCompany } from "@/lib/server/create-client-company";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { publishClientCompany } from "@/lib/server/publish-client-company";
import { acceptBuyer } from "@/lib/server/accept-buyer";
import { recordSuccessFee } from "@/lib/server/record-success-fee";

export type MandateActionState = { ok: true; message?: string } | { ok: false; message: string } | null;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function advisor() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded || user.role !== "advisor") {
    redirect("/mandatos");
  }

  return user;
}

export async function createClientCompanyAction(
  _state: MandateActionState,
  formData: FormData,
): Promise<MandateActionState> {
  const user = await advisor();
  const parsed = clientCompanySchema.safeParse({
    legalName: readText(formData, "legalName"),
    cif: readText(formData, "cif"),
    address: readText(formData, "address"),
    codename: readText(formData, "codename"),
    region: readText(formData, "region"),
    revenue: readText(formData, "revenue"),
    ebitda: readText(formData, "ebitda"),
    adjustedEbitda: readText(formData, "adjustedEbitda"),
    askingPrice: readText(formData, "askingPrice"),
  });

  if (!parsed.success) {
    const cif = parsed.error.issues.some((issue) => issue.path[0] === "cif");
    return { ok: false, message: cif ? billingCopy.cifInvalid : billingCopy.companyInvalid };
  }

  const result = await createClientCompany(user, parsed.data);

  if (result.ok) {
    revalidatePath("/mandatos");
    return { ok: true, message: billingCopy.companySaved };
  }

  return result;
}

export async function publishClientCompanyAction(
  _state: MandateActionState,
  formData: FormData,
): Promise<MandateActionState> {
  const user = await advisor();
  const slug = readText(formData, "slug");
  const result = await publishClientCompany(user, slug);
  return result;
}

export async function acceptBuyerAction(
  _state: MandateActionState,
  formData: FormData,
): Promise<MandateActionState> {
  const user = await advisor();
  const result = await acceptBuyer(user, readText(formData, "accessId"));

  if (result.ok) {
    revalidatePath("/mandatos");
    return { ok: true, message: billingCopy.buyerAccepted };
  }

  return result;
}

export async function recordAdvisorSaleAction(
  _state: MandateActionState,
  formData: FormData,
): Promise<MandateActionState> {
  const user = await advisor();
  const price = readText(formData, "price");

  if (!/^\d+(,\d{1,2})?$/.test(price)) {
    return { ok: false, message: billingCopy.salePriceInvalid };
  }

  const result = await recordSuccessFee(user, readText(formData, "slug"), eurosToCents(price));

  if (result.ok) {
    revalidatePath("/mandatos");
  }

  return result;
}
