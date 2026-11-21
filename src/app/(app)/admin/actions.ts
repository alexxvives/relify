"use server";

import { revalidatePath } from "next/cache";
import { approveProject } from "@/lib/server/approve-project";
import { changeAccountRole } from "@/lib/server/change-account-role";
import { grantInvestorPlan } from "@/lib/server/grant-investor-plan";
import { requireRole } from "@/lib/server/require-role";
import { setAccountSuspension } from "@/lib/server/set-account-suspension";
import { setVerified } from "@/lib/server/set-verified";
import { unpublishProject } from "@/lib/server/unpublish-project";
import { decideEbitdaAdjustment } from "@/lib/server/decide-ebitda-adjustment";
import { rotateAdminTeaserToken } from "@/lib/server/company-pdfs";
import { refundAdvisorDeposit } from "@/lib/server/deposit-refund";
import { adminCopy } from "@/lib/admin-copy";

export type AdminActionState = { ok: true; message: string } | { ok: false; message: string } | null;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function refreshAdmin(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/cuentas");
  revalidatePath("/admin/conexiones");
  revalidatePath("/admin/asesores");
  revalidatePath("/admin/facturacion");
}

function refreshCatalog(): void {
  refreshAdmin();
  revalidatePath("/proyectos");
  revalidatePath("/mercado");
  revalidatePath("/mi-empresa");
  revalidatePath("/mi-empresa/detalles");
  revalidatePath("/inicio");
}

/** S38: manual "Devolver depósito" for edge cases (also retries a failed automatic refund). Idempotent. */
export async function refundDepositAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await refundAdvisorDeposit(readText(formData, "engagementId"), "admin", user.id);
  revalidatePath("/admin/facturacion");
  if (!result.ok) {
    return { ok: false, message: adminCopy.refundUnavailable };
  }
  return result.status === "failed"
    ? { ok: false, message: adminCopy.refundFailed }
    : { ok: true, message: adminCopy.refundDone };
}

export async function approveEbitdaAdjustmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("admin");
  const slug = readText(formData, "slug");
  await decideEbitdaAdjustment(user, slug, readText(formData, "rowId"), "approved");
  refreshCatalog();
  if (slug) {
    revalidatePath(`/admin/empresas/${slug}`);
    revalidatePath(`/proyectos/${slug}`);
  }
}

/** S32 + S38: turn an adjustment down (pending or already approved) (optional note for the seller); the seller gets an aviso. */
export async function rejectEbitdaAdjustmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("admin");
  const slug = readText(formData, "slug");
  await decideEbitdaAdjustment(user, slug, readText(formData, "rowId"), "rejected", readText(formData, "note"));
  refreshCatalog();
  if (slug) {
    revalidatePath(`/admin/empresas/${slug}`);
    revalidatePath(`/proyectos/${slug}`);
  }
}

export async function unpublishProjectAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await unpublishProject(user, readText(formData, "projectId"));

  if (result.ok) {
    refreshCatalog();
  }

  return result;
}

export async function toggleVerifiedAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const target = readText(formData, "target") === "advisor" ? "advisor" : "project";
  const result = await setVerified(user, target, readText(formData, "id"), readText(formData, "verified") === "1");

  if (result.ok) {
    refreshCatalog();
    revalidatePath("/asesores");
  }

  return result;
}

export async function approveProjectAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await approveProject(user, readText(formData, "projectId"));

  if (result.ok) {
    refreshCatalog();
  }

  return result;
}

export async function suspendAccountAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await setAccountSuspension(user, readText(formData, "userId"), true);

  if (result.ok) {
    refreshAdmin();
  }

  return result;
}

export async function reactivateAccountAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await setAccountSuspension(user, readText(formData, "userId"), false);

  if (result.ok) {
    refreshAdmin();
  }

  return result;
}

export async function changeRoleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await changeAccountRole(user, readText(formData, "userId"), readText(formData, "role"));

  if (result.ok) {
    refreshAdmin();
  }

  return result;
}

export async function grantPlanAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await grantInvestorPlan(user, readText(formData, "userId"), readText(formData, "plan"));

  if (result.ok) {
    refreshAdmin();
    revalidatePath("/premium");
  }

  return result;
}

export async function regenerateAdminTeaserLinkAction(
  slug: string,
): Promise<{ ok: true; shareUrl: string } | { ok: false; message: string }> {
  const user = await requireRole("admin");
  const result = await rotateAdminTeaserToken(user, slug);
  if (result.ok) {
    revalidatePath(`/admin/empresas/${slug}`);
    revalidatePath("/mi-empresa");
  }
  return result;
}
