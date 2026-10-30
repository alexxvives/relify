"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/requireRole";
import { sabiFailureMessages } from "@/lib/sabi/failures";
import { confirmSabiImport } from "@/server/sabiImport";

export type SabiConfirmState = { ok: true; message: string } | { ok: false; message: string };

const failures = sabiFailureMessages;

function readInput(formData: FormData): { projectId: string; file: File | null } {
  const projectId = formData.get("projectId");
  const file = formData.get("file");
  return { projectId: typeof projectId === "string" ? projectId : "", file: file instanceof File && file.size > 0 ? file : null };
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
