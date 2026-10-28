"use server";

import { revalidatePath } from "next/cache";
import { approveProject } from "@/server/approveProject";
import { changeAccountRole } from "@/server/changeAccountRole";
import { grantInvestorPlan } from "@/server/grantInvestorPlan";
import { requireRole } from "@/server/requireRole";
import { setAccountSuspension } from "@/server/setAccountSuspension";
import { setVerified } from "@/server/setVerified";
import { unpublishProject } from "@/server/unpublishProject";

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
