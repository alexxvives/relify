"use server";

import { redirect } from "next/navigation";
import { authCopy } from "@/lib/auth-copy";
import { destinationForUser, signInFieldMessage, signInSchema, type SignInInput } from "@/lib/auth-input";
import { clientIp, takeThrottle, throttleHash } from "@/lib/server/email-throttle";
import { signIn } from "@/lib/server/sign-in";

export type SignInState = { message: string } | null;

function readSignInForm(formData: FormData): SignInInput | { message: string } {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: signInFieldMessage(parsed.error) };
  }

  return parsed.data;
}

export async function signInAction(_state: SignInState, formData: FormData): Promise<SignInState> {
  const input = readSignInForm(formData);

  if ("message" in input) {
    return input;
  }

  const ip = await clientIp();
  const ipOk = await takeThrottle(`signin:ip:${ip}`, 60, 15 * 60, false);
  const addressOk = await takeThrottle(
    `signin:email:${throttleHash(input.email)}`,
    10,
    15 * 60,
    false,
  );
  if (!ipOk || !addressOk) {
    return { message: authCopy.forgotThrottled };
  }

  const result = await signIn(input);

  if (!result.ok) {
    return { message: result.message };
  }

  const rawNext = formData.get("siguiente");
  const next = typeof rawNext === "string" ? rawNext : null;
  redirect(destinationForUser(result, next));
}
