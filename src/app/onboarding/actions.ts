"use server";

import { redirect } from "next/navigation";
import { homeForRole, onboardingFieldMessage, onboardingSchema, type OnboardingInput } from "@/lib/auth-input";
import { completeOnboarding } from "@/server/completeOnboarding";

export type OnboardingState = { message: string } | null;

function readOnboardingForm(formData: FormData): OnboardingInput | { message: string } {
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    lastName: formData.get("lastName"),
    nationalId: formData.get("nationalId"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    referralSource: formData.get("referralSource"),
  });

  if (!parsed.success) {
    return { message: onboardingFieldMessage(parsed.error) };
  }

  return parsed.data;
}

export async function onboardingAction(_state: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const input = readOnboardingForm(formData);

  if ("message" in input) {
    return input;
  }

  const result = await completeOnboarding(input);

  if (!result.ok) {
    if (result.code === "signed_out") {
      redirect("/entrar");
    }

    return { message: result.message };
  }

  redirect(homeForRole(result.role));
}
