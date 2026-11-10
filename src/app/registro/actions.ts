"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCopy } from "@/lib/auth-copy";
import {
  signUpFieldMessage,
  signUpSchema,
  type SignUpInput,
} from "@/lib/auth-input";
import { clientIp, takeThrottle } from "@/server/emailThrottle";
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

export async function signUpAction(
  _state: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const input = readSignUpForm(formData);

  if ("message" in input) {
    return input;
  }

  const role = formData.get("signupRole");
  if (role !== "seller" && role !== "investor" && role !== "advisor") {
    return { message: authCopy.signupRoleRequired };
  }

  // Each signup sends a confirmation email: cap per IP so the form cannot be used to spam.
  if (!(await takeThrottle(`signup:ip:${await clientIp()}`, 10, 60 * 60, false))) {
    return { message: authCopy.forgotThrottled };
  }

  const result = await signUp(input);

  if (!result.ok) {
    return { message: result.message };
  }

  if (role === "seller" || role === "investor" || role === "advisor") {
    const jar = await cookies();
    jar.set("Relify-entry-role", role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
  }

  redirect("/onboarding");
}
