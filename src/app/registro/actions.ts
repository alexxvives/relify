"use server";

import { redirect } from "next/navigation";
import { signUpFieldMessage, signUpSchema, type SignUpInput } from "@/lib/auth-input";
import { signUp } from "@/server/signUp";

export type SignUpState = { message: string } | null;

function readSignUpForm(formData: FormData): SignUpInput | { message: string } {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: signUpFieldMessage(parsed.error) };
  }

  return parsed.data;
}

export async function signUpAction(_state: SignUpState, formData: FormData): Promise<SignUpState> {
  const input = readSignUpForm(formData);

  if ("message" in input) {
    return input;
  }

  const result = await signUp(input);

  if (!result.ok) {
    return { message: result.message };
  }

  redirect("/onboarding");
}
