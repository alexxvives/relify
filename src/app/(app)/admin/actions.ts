"use server";

import { revalidatePath } from "next/cache";
import { approveProject } from "@/lib/server/approve-project";
import { changeAccountRole } from "@/lib/server/change-account-role";
import { grantInvestorPlan } from "@/lib/server/grant-investor-plan";
import { requireRole } from "@/lib/server/require-role";
import { setAccountSuspension } from "@/lib/server/set-account-suspension";
import { setVerified } from "@/lib/server/set-verified";
import { unpublishProject } from "@/lib/server/unpublish-project";
import { approveEbitdaAdjustment } from "@/lib/server/approve-ebitda-adjustment";
import { rejectEbitdaAdjustment } from "@/lib/server/reject-ebitda-adjustment";
import { rotateAdminTeaserToken } from "@/lib/server/company-pdfs";

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
  revalidatePath("/mandatos");
}

export async function approveEbitdaAdjustmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("admin");
  const slug = readText(formData, "slug");
  await approveEbitdaAdjustment(user, slug, readText(formData, "rowId"));
  refreshCatalog();
  if (slug) {
    revalidatePath(`/admin/empresas/${slug}`);
    revalidatePath(`/proyectos/${slug}`);
  }
}

/** S32: turn a pending adjustment down (optional note for the seller); the seller gets an aviso. */
export async function rejectEbitdaAdjustmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("admin");
  const slug = readText(formData, "slug");
  await rejectEbitdaAdjustment(user, slug, readText(formData, "rowId"), readText(formData, "note"));
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
