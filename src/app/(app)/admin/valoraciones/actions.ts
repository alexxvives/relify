"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/server/require-role";
import { updateValuationRequest } from "@/lib/server/update-valuation-request";
import type { AdminActionState } from "@/app/(app)/admin/actions";

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function updateValuationRequestAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await updateValuationRequest(user, {
    id: readText(formData, "id"),
    status: readText(formData, "status"),
    notes: readText(formData, "notes"),
  });

  if (result.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/valoraciones");
  }

  return result;
}
