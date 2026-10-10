"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { investorProfileSchema } from "@/lib/investor-profile";
import { getCurrentUser } from "@/server/getCurrentUser";
import { saveInvestorPhoto, saveInvestorProfile } from "@/server/investorProfile";

export type InvestorProfileState = { ok: true } | { ok: false; message: string } | null;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function saveInvestorPhotoAction(photo: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();

  if (!user || !user.onboarded || user.role !== "investor") {
    return { ok: false };
  }

  const saved = await saveInvestorPhoto(user, photo);

  if (saved.ok) {
    revalidatePath("/inversor");
    revalidatePath("/inversor/perfil");
    revalidatePath("/cuenta");
    revalidatePath("/mi-empresa/procesos");
  }

  return saved;
}

export async function saveInvestorProfileAction(
  _state: InvestorProfileState,
  formData: FormData,
): Promise<InvestorProfileState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const parsed = investorProfileSchema.safeParse({
    photo: readText(formData, "photo"),
    city: readText(formData, "city"),
    province: readText(formData, "province"),
    investorType: readText(formData, "investorType"),
    ticket: readText(formData, "ticket"),
    sectors: readText(formData, "sectors"),
    thesis: readText(formData, "thesis"),
    contribution: readText(formData, "contribution"),
    stake: readText(formData, "stake"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Revisa la foto, dónde estás, el tipo, el ticket y qué buscas." };
  }

  const saved = await saveInvestorProfile(user, parsed.data);

  if (!saved.ok) {
    return { ok: false, message: "No se ha podido guardar el perfil." };
  }

  revalidatePath("/inversor");
  revalidatePath("/inversor/perfil");
  revalidatePath("/mi-empresa/procesos");
  return { ok: true };
}
