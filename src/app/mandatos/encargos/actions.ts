"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { engagementCopy } from "@/lib/engagement-copy";
import { eurosToCents } from "@/lib/company-draft";
import { acceptAdvisorNda, claimEngagement, closeEngagement, setAdvisorFolder, setAdvisorProcess } from "@/server/advisoryEngagement";
import { getCurrentUser } from "@/server/getCurrentUser";
import { startAdvisorInboxCheckout } from "@/server/startCheckout";

export type EngagementActionState = { ok: boolean; message: string } | null;

async function signedIn() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  return user;
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function claimEngagementAction(
  _state: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  const user = await signedIn();
  const result = await claimEngagement(user, readText(formData, "engagementId"));

  if (result.ok) {
    revalidatePath("/mandatos");
  }

  return { ok: result.ok, message: result.message ?? engagementCopy.claimed };
}

export async function startInboxCheckoutAction(
  state: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  void state;
  void formData;
  const user = await signedIn();
  const result = await startAdvisorInboxCheckout(user);

  if (!result.ok) {
    return result;
  }

  redirect(result.url);
}

export async function acceptAdvisorNdaAction(
  _state: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  const user = await signedIn();
  const id = readText(formData, "engagementId");
  const result = await acceptAdvisorNda(user, id);

  if (result.ok) {
    revalidatePath(`/mandatos/encargos/${id}`);
  }

  return { ok: result.ok, message: result.message ?? engagementCopy.ndaSigned };
}

export async function closeEngagementAction(
  _state: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  const user = await signedIn();
  const price = readText(formData, "price");

  if (!/^\d+(,\d{1,2})?$/.test(price)) {
    return { ok: false, message: engagementCopy.feeInvalid };
  }

  const id = readText(formData, "engagementId");
  const result = await closeEngagement(user, id, eurosToCents(price));

  if (result.ok) {
    revalidatePath(`/mandatos/encargos/${id}`);
  }

  return { ok: result.ok, message: result.message ?? engagementCopy.feeStored };
}

export async function setAdvisorFolderAction(
  _state: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  const user = await signedIn();
  const id = readText(formData, "engagementId");
  const result = await setAdvisorFolder(user, id, readText(formData, "folder"), readText(formData, "open") === "1");
  revalidatePath("/mi-empresa/documentos");
  revalidatePath(`/mandatos/encargos/${id}`);
  return { ok: result.ok, message: result.message ?? engagementCopy.openFolder };
}

export async function setAdvisorProcessAction(
  _state: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  const user = await signedIn();
  const id = readText(formData, "engagementId");
  const result = await setAdvisorProcess(user, id, readText(formData, "open") === "1");
  revalidatePath("/mi-empresa/procesos");
  revalidatePath(`/mandatos/encargos/${id}`);
  return { ok: result.ok, message: result.message ?? engagementCopy.openProcess };
}
