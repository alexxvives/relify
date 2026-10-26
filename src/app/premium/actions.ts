"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { billingCopy } from "@/lib/billing-copy";
import { getCurrentUser } from "@/server/getCurrentUser";
import { startBuyerCheckout } from "@/server/startCheckout";
import { changeSubscriptionPlan, setSubscriptionCancel, startCardSetup, updateBillingEmail } from "@/server/subscriptionDesk";

export type PlanActionState = { ok: false; message: string } | null;

export type SubscriptionActionState = { ok: boolean; message: string } | null;

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

export async function changeBuyerPlanAction(_state: PlanActionState, formData: FormData): Promise<PlanActionState> {
  const user = await investor();
  const plan = formData.get("plan");

  if (plan !== "limited" && plan !== "unlimited") {
    return { ok: false, message: billingCopy.stripeFailed };
  }

  const result = await changeSubscriptionPlan(user, plan);

  if (!result.ok) {
    return result;
  }

  revalidatePath("/premium");
  revalidatePath("/premium/suscripcion");
  redirect("/premium?changed=1");
}

export async function setSubscriptionCancelAction(
  _state: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const user = await investor();
  const cancel = formData.get("cancel") === "1";
  const result = await setSubscriptionCancel(user, cancel);

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/premium/suscripcion");
  revalidatePath("/premium");
  return { ok: true, message: cancel ? billingCopy.cancelSaved : billingCopy.keepSaved };
}

export async function updateBillingEmailAction(
  _state: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const user = await investor();
  const email = formData.get("email");
  const result = await updateBillingEmail(user, typeof email === "string" ? email : "");

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/premium/suscripcion");
  return { ok: true, message: billingCopy.billingEmailSaved };
}

export async function startCardSetupAction(_state: SubscriptionActionState, formData: FormData): Promise<SubscriptionActionState> {
  void formData;
  const user = await investor();
  const result = await startCardSetup(user);

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  redirect(result.url);
}
