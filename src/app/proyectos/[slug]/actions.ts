"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accessCopy } from "@/lib/access-copy";
import { projectAccessInputSchema, type ProjectAccessInput } from "@/lib/project-access";
import { acceptNda } from "@/server/acceptNda";
import { getCurrentUser, type CurrentUser } from "@/server/getCurrentUser";
import { requestProjectAccess } from "@/server/requestProjectAccess";
import { companyCopy } from "@/lib/company-copy";
import { investorMessageSchema } from "@/lib/project-message";
import { postInvestorMessage } from "@/server/postProjectMessage";
import { approveMeeting, rescheduleMeeting, updateMeetingNotes } from "@/server/updateMeetingNotes";
import { toggleProjectFavorite, type FavoriteResult } from "@/server/toggleProjectFavorite";

export type ProjectAccessActionState = { ok: true } | { ok: false; message: string } | null;

function readAccessInput(formData: FormData): ProjectAccessInput | { message: string } {
  const slug = formData.get("slug");
  const parsed = projectAccessInputSchema.safeParse({ slug: typeof slug === "string" ? slug : "" });

  if (!parsed.success) {
    return { message: accessCopy.missing };
  }

  return parsed.data;
}

async function currentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  return user;
}

export async function requestProjectAccessAction(
  _state: ProjectAccessActionState,
  formData: FormData,
): Promise<ProjectAccessActionState> {
  const user = await currentUser();
  const input = readAccessInput(formData);

  if ("message" in input) {
    return { ok: false, message: input.message };
  }

  const result = await requestProjectAccess(user, input);

  if (result.ok) {
    revalidatePath(`/proyectos/${input.slug}`);
  }

  return result;
}

export async function acceptNdaAction(
  _state: ProjectAccessActionState,
  formData: FormData,
): Promise<ProjectAccessActionState> {
  const user = await currentUser();
  const input = readAccessInput(formData);

  if ("message" in input) {
    return { ok: false, message: input.message };
  }

  const result = await acceptNda(user, input);

  if (result.ok) {
    revalidatePath(`/proyectos/${input.slug}`);
  }

  return result;
}

export async function postInvestorMessageAction(
  _state: ProjectAccessActionState,
  formData: FormData,
): Promise<ProjectAccessActionState> {
  const user = await currentUser();
  const slug = formData.get("slug");
  const kind = formData.get("kind");
  const body = formData.get("body");
  const parsed = investorMessageSchema.safeParse({
    slug: typeof slug === "string" ? slug : "",
    kind: typeof kind === "string" ? kind : "",
    body: typeof body === "string" ? body : "",
  });

  if (!parsed.success) {
    const written = typeof body === "string" ? body.trim() : "";
    return { ok: false, message: written.length === 0 ? companyCopy.messageInvalid : companyCopy.messageFailed };
  }

  const result = await postInvestorMessage(user, parsed.data);

  if (result.ok) {
    revalidatePath(`/proyectos/${parsed.data.slug}`);
  }

  return result;
}

export async function updateInvestorMeetingNotesAction(
  _state: ProjectAccessActionState,
  formData: FormData,
): Promise<ProjectAccessActionState> {
  const user = await currentUser();
  const slug = formData.get("slug");
  const messageId = formData.get("messageId");
  const notes = formData.get("notes");
  const result = await updateMeetingNotes(user, {
    slug: typeof slug === "string" ? slug : "",
    messageId: typeof messageId === "string" ? messageId : "",
    notes: typeof notes === "string" ? notes : "",
  });

  if (result.ok && typeof slug === "string") {
    revalidatePath(`/proyectos/${slug}`);
  }

  return result;
}

export async function approveInvestorMeetingAction(
  _state: ProjectAccessActionState,
  formData: FormData,
): Promise<ProjectAccessActionState> {
  const user = await currentUser();
  const slug = formData.get("slug");
  const messageId = formData.get("messageId");
  const result = await approveMeeting(user, {
    slug: typeof slug === "string" ? slug : "",
    messageId: typeof messageId === "string" ? messageId : "",
  });

  if (result.ok && typeof slug === "string") {
    revalidatePath(`/proyectos/${slug}`);
  }

  return result;
}

export async function rescheduleInvestorMeetingAction(
  _state: ProjectAccessActionState,
  formData: FormData,
): Promise<ProjectAccessActionState> {
  const user = await currentUser();
  const slug = formData.get("slug");
  const messageId = formData.get("messageId");
  const body = formData.get("body");
  const result = await rescheduleMeeting(user, {
    slug: typeof slug === "string" ? slug : "",
    messageId: typeof messageId === "string" ? messageId : "",
    body: typeof body === "string" ? body : "",
  });

  if (result.ok && typeof slug === "string") {
    revalidatePath(`/proyectos/${slug}`);
  }

  return result;
}

export async function toggleFavoriteAction(slug: string): Promise<FavoriteResult> {
  const user = await currentUser();
  const result = await toggleProjectFavorite(user, slug);

  if (result.ok) {
    revalidatePath("/mercado");
    revalidatePath(`/proyectos/${slug}`);
  }

  return result;
}
