"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/server/require-role";
import { saveSabiDetail } from "@/lib/server/sabi-detail";
import { activeSellerProjectId } from "@/lib/server/seller-company";

export type SabiDetailState = { saved: boolean; message: string } | null;

export async function saveSabiDetailAction(_state: SabiDetailState, formData: FormData): Promise<SabiDetailState> {
  const user = await requireRole("seller");
  const projectId = await activeSellerProjectId(user.id);

  if (!projectId) {
    return { saved: false, message: "Primero da de alta la empresa." };
  }

  const result = await saveSabiDetail(projectId, user.id, formData);

  if (!result.ok) {
    return { saved: false, message: `Revisa «${result.field}»: el formato no es válido.` };
  }

  revalidatePath("/mi-empresa/detalles");
  return { saved: true, message: "Datos guardados." };
}
