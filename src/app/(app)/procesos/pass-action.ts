"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { passDiligence } from "@/lib/server/pass-diligence";

export type PassDiligenceState = { ok: true } | { ok: false; message: string } | null;

export async function passDiligenceAction(_state: PassDiligenceState, formData: FormData): Promise<PassDiligenceState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const accessId = formData.get("accessId");
  const result = await passDiligence(user, typeof accessId === "string" ? accessId : "");

  if (!result.ok) {
    return result;
  }

  revalidatePath("/procesos");
  revalidatePath("/mi-empresa/procesos");
  revalidatePath(`/proyectos/${result.slug}`);
  return { ok: true };
}
