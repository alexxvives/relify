"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { advisoryCopy, advisoryQuoteSchema, uniqueAdvisoryServices } from "@/lib/advisory";
import { engagementCopy } from "@/lib/engagement-copy";
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

  const advisorRaw = formData.get("advisorId");
  const slugRaw = formData.get("projectSlug");
  const parsed = advisoryQuoteSchema.safeParse({
    services: uniqueAdvisoryServices(formData.getAll("services").filter((value): value is string => typeof value === "string")),
    projectSlug: typeof slugRaw === "string" ? slugRaw : "",
    ...(typeof advisorRaw === "string" && advisorRaw !== "" ? { advisorId: advisorRaw } : {}),
  });

  if (!parsed.success) {
    const missingCompany = parsed.error.issues.some((issue) => issue.path[0] === "projectSlug");
    return { ok: false, message: missingCompany ? engagementCopy.companyRequired : advisoryCopy.empty };
  }

  const result = await submitAdvisoryQuote(user, parsed.data);

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/asesoramiento");
  revalidatePath("/mi-empresa/servicios");
  revalidatePath("/mandatos");
  revalidatePath("/admin");
  return { ok: true, message: advisoryCopy.saved };
}
