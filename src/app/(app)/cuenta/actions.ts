"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authCopy } from "@/lib/auth-copy";
import {
  accountProfileSchema,
  onboardingFieldMessage,
  parseAccountEmail,
  splitAccountName,
} from "@/lib/auth-input";
import { auth } from "@/lib/server/auth";
import { authFailureMessage } from "@/lib/server/auth-failure";
import { getAccountNationalId } from "@/lib/server/get-account-national-id";
import { getCurrentUser } from "@/lib/server/get-current-user";
import {
  markNotificationRead,
  markNotificationsRead,
} from "@/lib/server/mark-notifications-read";
import { takeThrottle } from "@/lib/server/email-throttle";
import { mailConfigured } from "@/lib/server/mailer";
import { signOut } from "@/lib/server/sign-out";
import { updateAccountProfile } from "@/lib/server/update-account-profile";

export type AccountFormState = {
  message: string;
  saved: boolean;
  emailHeld?: boolean;
} | null;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/entrar");
}

export async function updateAccountAction(
  _state: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const split = splitAccountName(readText(formData, "fullName"));

  if (!split) {
    return { message: authCopy.fullNameRequired, saved: false };
  }

  const storedId = await getAccountNationalId(user.id);
  const submittedId = readText(formData, "nationalId").trim();
  const keepStored = formData.get("nationalIdKeep") === "1" && submittedId.length === 0 && Boolean(storedId);
  const parsed = accountProfileSchema.safeParse({
    name: split.name,
    lastName: split.lastName,
    nationalId: keepStored ? (storedId ?? "") : submittedId,
    phoneCountry: readText(formData, "phoneCountry"),
    phone: readText(formData, "phone"),
  });

  if (!parsed.success) {
    return { message: onboardingFieldMessage(parsed.error), saved: false };
  }

  const nextEmail = parseAccountEmail(readText(formData, "email"));

  if (!nextEmail) {
    return { message: authCopy.invalidEmail, saved: false };
  }

  const result = await updateAccountProfile(user.id, parsed.data);

  if (!result.ok) {
    return { message: result.message, saved: false };
  }

  revalidatePath("/", "layout");

  if (nextEmail === user.email.toLowerCase()) {
    return { message: authCopy.accountSaved, saved: true };
  }

  if (!mailConfigured()) {
    return { message: authCopy.emailChangeHeld, saved: true, emailHeld: true };
  }

  if (!(await takeThrottle(`change-email:user:${user.id}`, 5, 60 * 60))) {
    return { message: authCopy.forgotThrottled, saved: true, emailHeld: true };
  }

  try {
    await auth.api.changeEmail({
      body: { newEmail: nextEmail, callbackURL: "/cuenta" },
      headers: await headers(),
    });
  } catch (error) {
    return {
      message: authFailureMessage(error, authCopy.emailChangeFailed),
      saved: true,
      emailHeld: true,
    };
  }

  return { message: authCopy.emailChangeSent, saved: true, emailHeld: true };
}

export async function changePasswordAction(
  _state: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const newPassword = readText(formData, "newPassword");
  const confirmPassword = readText(formData, "confirmPassword");

  if (newPassword.length < 8 || newPassword.length > 128) {
    return { message: authCopy.passwordLength, saved: false };
  }

  if (newPassword !== confirmPassword) {
    return { message: authCopy.passwordMismatch, saved: false };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: readText(formData, "currentPassword"),
        newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    return {
      message: authFailureMessage(error, authCopy.passwordFailed),
      saved: false,
    };
  }

  return { message: authCopy.passwordChanged, saved: true };
}

export async function deleteAccountAction(
  _state: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (readText(formData, "confirm") !== authCopy.deletePhrase) {
    return { message: authCopy.deleteMismatch, saved: false };
  }

  try {
    await auth.api.deleteUser({
      body: { password: readText(formData, "password") },
      headers: await headers(),
    });
  } catch (error) {
    return {
      message: authFailureMessage(error, authCopy.deleteFailed),
      saved: false,
    };
  }

  redirect("/entrar");
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  await markNotificationsRead(user.id);
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await getCurrentUser();

  if (!user || !/^[0-9a-f-]{36}$/i.test(id)) {
    return;
  }

  await markNotificationRead(user.id, id);
  revalidatePath("/", "layout");
}
