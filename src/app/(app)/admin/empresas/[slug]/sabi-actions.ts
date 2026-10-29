"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/requireRole";
import { confirmSabiImport, previewSabiImport, type SabiImportFailure, type SabiPreview } from "@/server/sabiImport";

export type SabiPreviewState = { ok: true; preview: SabiPreview } | { ok: false; message: string };
export type SabiConfirmState = { ok: true; message: string } | { ok: false; message: string };

const failures: Record<SabiImportFailure, string> = {
  forbidden: "Solo un administrador puede importar SABI.",
  not_found: "No encontramos esta empresa.",
  empty: "Elige el Excel exportado de SABI.",
  too_large: "El archivo supera 10 MB.",
  not_xlsx: "El archivo no es un Excel (.xlsx) válido.",
  no_financials: "No encontramos la tabla de cuentas de SABI en este Excel.",
};

function readInput(formData: FormData): { projectId: string; file: File | null } {
  const projectId = formData.get("projectId");
  const file = formData.get("file");
  return { projectId: typeof projectId === "string" ? projectId : "", file: file instanceof File && file.size > 0 ? file : null };
}

export async function previewSabiAction(formData: FormData): Promise<SabiPreviewState> {
  const user = await requireRole("admin");
  const { projectId, file } = readInput(formData);

  if (!file) {
    return { ok: false, message: failures.empty };
  }

  const result = await previewSabiImport(user, projectId, new Uint8Array(await file.arrayBuffer()), file.name);
  return result.ok ? { ok: true, preview: result.value } : { ok: false, message: failures[result.code] };
}

export async function confirmSabiAction(formData: FormData): Promise<SabiConfirmState> {
  const user = await requireRole("admin");
  const { projectId, file } = readInput(formData);

  if (!file) {
    return { ok: false, message: failures.empty };
  }

  const result = await confirmSabiImport(user, projectId, new Uint8Array(await file.arrayBuffer()), file.name);

  if (!result.ok) {
    return { ok: false, message: failures[result.code] };
  }

  revalidatePath("/admin/empresas", "layout");
  revalidatePath("/mi-empresa");
  revalidatePath("/proyectos");
  revalidatePath("/mercado");
  return { ok: true, message: `Ficha actualizada con SABI (${result.value.years.join(", ")}).` };
}
