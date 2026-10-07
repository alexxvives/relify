"use server";

import { redirect } from "next/navigation";
import { billingCopy } from "@/lib/billing-copy";
import { getCurrentUser } from "@/server/getCurrentUser";
import { openPortal, startBuyerCheckout } from "@/server/startCheckout";

export type PlanActionState = { ok: false; message: string } | null;

async function investor() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded || user.role !== "investor") {
    redirect("/inversor");
  }

  return user;
}

export async function startBuyerPlanAction(_state: PlanActionState, formData: FormData): Promise<PlanActionState> {
  const user = await investor();
  const plan = formData.get("plan");

  if (plan !== "limited" && plan !== "unlimited") {
    return { ok: false, message: billingCopy.stripeFailed };
  }

  const result = await startBuyerCheckout(user, plan);

  if (!result.ok) {
    return result;
  }

  redirect(result.url);
}

export async function openBillingPortalAction(state: PlanActionState, formData: FormData): Promise<PlanActionState> {
  void state;
  void formData;
  const user = await investor();
  const result = await openPortal(user);

  if (!result.ok) {
    return result;
  }

  redirect(result.url);
}
