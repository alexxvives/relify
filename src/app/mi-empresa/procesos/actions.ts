"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { billingCopy } from "@/lib/billing-copy";
import { eurosToCents } from "@/lib/company-draft";
import { sellerCopy } from "@/lib/seller-copy";
import { sellerMessageSchema } from "@/lib/project-message";
import { acceptBuyer } from "@/server/acceptBuyer";
import { getCurrentUser } from "@/server/getCurrentUser";
import { postSellerMessage } from "@/server/postProjectMessage";
import { approveMeeting, updateMeetingNotes } from "@/server/updateMeetingNotes";
import { recordSuccessFee } from "@/server/recordSuccessFee";

export type SellerMessageState = { ok: true; message?: string } | { ok: false; message: string } | null;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function postSellerMessageAction(
  _state: SellerMessageState,
  formData: FormData,
): Promise<SellerMessageState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const parsed = sellerMessageSchema.safeParse({
    accessId: readText(formData, "accessId"),
    kind: readText(formData, "kind"),
    body: readText(formData, "body"),
  });

  if (!parsed.success) {
    return { ok: false, message: sellerCopy.replyInvalid };
  }

  const result = await postSellerMessage(user, parsed.data);

  if (result.ok) {
    revalidatePath("/mi-empresa/procesos");
  }

  return result;
}

export async function updateSellerMeetingNotesAction(
  _state: SellerMessageState,
  formData: FormData,
): Promise<SellerMessageState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const result = await updateMeetingNotes(user, {
    accessId: readText(formData, "accessId"),
    messageId: readText(formData, "messageId"),
    notes: readText(formData, "notes"),
  });

  if (result.ok) {
    revalidatePath("/mi-empresa/procesos");
  }

  return result;
}

export async function approveSellerMeetingAction(
  _state: SellerMessageState,
  formData: FormData,
): Promise<SellerMessageState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const result = await approveMeeting(user, {
    accessId: readText(formData, "accessId"),
    messageId: readText(formData, "messageId"),
  });

  if (result.ok) {
    revalidatePath("/mi-empresa/procesos");
  }

  return result;
}

async function seller() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded || user.role !== "seller") {
    redirect("/mi-empresa");
  }

  return user;
}

export async function acceptSellerBuyerAction(
  _state: SellerMessageState,
  formData: FormData,
): Promise<SellerMessageState> {
  const user = await seller();
  const result = await acceptBuyer(user, readText(formData, "accessId"));

  if (result.ok) {
    revalidatePath("/mi-empresa/procesos");
    return { ok: true };
  }

  return result;
}

export async function recordSellerSaleAction(
  _state: SellerMessageState,
  formData: FormData,
): Promise<SellerMessageState> {
  const user = await seller();
  const price = readText(formData, "price");

  if (!/^\d+(,\d{1,2})?$/.test(price)) {
    return { ok: false, message: billingCopy.salePriceInvalid };
  }

  const result = await recordSuccessFee(user, readText(formData, "slug"), eurosToCents(price));

  if (result.ok) {
    revalidatePath("/mi-empresa/procesos");
  }

  return result;
}
