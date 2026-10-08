"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { engagementMeetingSchema, engagementMessageSchema } from "@/lib/engagement-thread";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";
import { getCurrentUser } from "@/server/getCurrentUser";
import {
  approveEngagementMeeting,
  postEngagementMessage,
  rescheduleEngagementMeeting,
} from "@/server/engagementThread";

export type EngagementMessageState = { ok: true } | { ok: false; message: string } | null;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function reader() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  return user;
}

function refresh(engagementId: string) {
  revalidatePath("/asesoramiento");
  revalidatePath("/mi-empresa/servicios");
  revalidatePath(`/mandatos/encargos/${engagementId}`);
}

export async function postEngagementMessageAction(
  _state: EngagementMessageState,
  formData: FormData,
): Promise<EngagementMessageState> {
  const user = await reader();
  const parsed = engagementMessageSchema.safeParse({
    engagementId: readText(formData, "engagementId"),
    kind: readText(formData, "kind"),
    body: readText(formData, "body"),
  });

  if (!parsed.success) {
    return { ok: false, message: readText(formData, "body").trim().length === 0 ? sellerCopy.replyInvalid : engagementCopy.missing };
  }

  const result = await postEngagementMessage(user, parsed.data);

  if (result.ok) {
    refresh(parsed.data.engagementId);
  }

  return result;
}

export async function approveEngagementMeetingAction(
  _state: EngagementMessageState,
  formData: FormData,
): Promise<EngagementMessageState> {
  const user = await reader();
  const parsed = engagementMeetingSchema.safeParse({
    engagementId: readText(formData, "engagementId"),
    messageId: readText(formData, "messageId"),
  });

  if (!parsed.success) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  const result = await approveEngagementMeeting(user, parsed.data);

  if (result.ok) {
    refresh(parsed.data.engagementId);
  }

  return result;
}

export async function rescheduleEngagementMeetingAction(
  _state: EngagementMessageState,
  formData: FormData,
): Promise<EngagementMessageState> {
  const user = await reader();
  const parsed = engagementMeetingSchema.safeParse({
    engagementId: readText(formData, "engagementId"),
    messageId: readText(formData, "messageId"),
    body: readText(formData, "body"),
  });

  if (!parsed.success || !parsed.data.body) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  const result = await rescheduleEngagementMeeting(user, {
    engagementId: parsed.data.engagementId,
    messageId: parsed.data.messageId,
    body: parsed.data.body,
  });

  if (result.ok) {
    refresh(parsed.data.engagementId);
  }

  return result;
}
