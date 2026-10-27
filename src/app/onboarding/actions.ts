"use server";

import { redirect } from "next/navigation";
import { authCopy } from "@/lib/auth-copy";
import { homeForRole, onboardingFieldMessage, onboardingSchema, splitAccountName, type OnboardingInput } from "@/lib/auth-input";
import { completeOnboarding } from "@/server/completeOnboarding";
import { getCurrentUser } from "@/server/getCurrentUser";
import { startBuyerCheckout } from "@/server/startCheckout";

export type OnboardingState = { message: string } | null;

/** Where Stripe's back button lands during signup: the Plan step again. */
const onboardingPlanPath = "/onboarding?paso=plan";

function readOnboardingForm(formData: FormData): OnboardingInput | { message: string } {
  const fullName = formData.get("fullName");
  const split = splitAccountName(typeof fullName === "string" ? fullName : "");

  if (!split) {
    return { message: authCopy.fullNameRequired };
  }

  const parsed = onboardingSchema.safeParse({
    name: split.name,
    lastName: split.lastName,
    nationalId: formData.get("nationalId"),
    phoneCountry: formData.get("phoneCountry"),
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

  const plan = formData.get("plan");

  if (result.role === "investor" && (plan === "limited" || plan === "unlimited")) {
    const user = await getCurrentUser();
    const checkout = user ? await startBuyerCheckout(user, plan, { cancelPath: onboardingPlanPath }) : null;
    redirect(checkout?.ok ? checkout.url : "/premium");
  }

  redirect(homeForRole(result.role));
}

/** Resumes the Plan step after the buyer backed out of Stripe during signup. */
export async function resumePlanAction(_state: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const plan = formData.get("plan");

  if (user.role !== "investor" || (plan !== "limited" && plan !== "unlimited")) {
    redirect(homeForRole(user.role));
  }

  const checkout = await startBuyerCheckout(user, plan, { cancelPath: onboardingPlanPath });

  if (!checkout.ok) {
    return { message: checkout.message };
  }

  redirect(checkout.url);
}
