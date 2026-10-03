"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { advisoryCopy, advisoryQuoteSchema, uniqueAdvisoryServices } from "@/lib/advisory";
import { getCurrentUser } from "@/server/getCurrentUser";
import { submitAdvisoryQuote } from "@/server/submitAdvisoryQuote";

export type AdvisoryQuoteState = { ok: boolean; message: string } | null;

export async function requestAdvisoryQuoteAction(
  _state: AdvisoryQuoteState,
  formData: FormData,
): Promise<AdvisoryQuoteState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const parsed = advisoryQuoteSchema.safeParse({
    services: uniqueAdvisoryServices(formData.getAll("services").filter((value): value is string => typeof value === "string")),
  });

  if (!parsed.success) {
    return { ok: false, message: advisoryCopy.empty };
  }

  const result = await submitAdvisoryQuote(user, parsed.data);

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/asesoramiento");
  revalidatePath("/mi-empresa/servicios");
  return { ok: true, message: advisoryCopy.saved };
}
