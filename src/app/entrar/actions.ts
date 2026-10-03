"use server";

import { redirect } from "next/navigation";
import { destinationForUser, signInFieldMessage, signInSchema, type SignInInput } from "@/lib/auth-input";
import { signIn } from "@/server/signIn";

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

  const result = await signIn(input);

  if (!result.ok) {
    return { message: result.message };
  }

  redirect(destinationForUser(result));
}
