"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { previewCompanyNif, verifyCompanyNif, type PreviewNifResult } from "@/lib/server/verify-company-nif";

export type VerifyNifState = { ok: true } | { ok: false; message: string } | null;

export async function verifyCompanyNifAction(_state: VerifyNifState, formData: FormData): Promise<VerifyNifState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const nif = formData.get("nif");
  const result = await verifyCompanyNif(user, typeof nif === "string" ? nif : "");

  if (!result.ok) {
    return result;
  }

  // Not "/mi-empresa": refreshing it would unmount the dialog before the seller reads the confirmation.
  revalidatePath("/mi-empresa/detalles");
  return { ok: true };
}

/** t80: registry name for a typed CIF, shown as "¿Es esta tu empresa?" before anything is saved. */
export async function previewCompanyNifAction(nif: string): Promise<PreviewNifResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/entrar");
  }
  return previewCompanyNif(user, nif);
}
