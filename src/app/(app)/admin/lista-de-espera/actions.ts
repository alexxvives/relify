"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/server/require-role";
import { deleteWaitlistEntry } from "@/lib/server/delete-waitlist-entry";
import type { AdminActionState } from "@/app/(app)/admin/actions";

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function deleteWaitlistAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireRole("admin");
  const result = await deleteWaitlistEntry(user, readText(formData, "id"));

  if (result.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/lista-de-espera");
  }

  return result;
}
