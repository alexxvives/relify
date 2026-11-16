"use server";

import { revalidatePath } from "next/cache";
import { advisorCopy } from "@/lib/advisor-copy";
import {
  corporateInputSchema,
  dealsInputSchema,
  firstIssue,
  servicesInputSchema,
} from "@/lib/advisor-profile";
import { getCurrentUser } from "@/lib/server/get-current-user";
import {
  saveAdvisorCorporate,
  saveAdvisorDeals,
  saveAdvisorServices,
  type AdvisorSaveResult,
} from "@/lib/server/save-advisor-profile";

async function advisorUserId(): Promise<string | AdvisorSaveResult> {
  const user = await getCurrentUser();

  if (!user || !user.onboarded || user.role !== "advisor") {
    return { ok: false, message: advisorCopy.forbidden };
  }

  return user.id;
}

function refreshAdvisor() {
  revalidatePath("/mis-servicios");
  revalidatePath("/mandatos");
}

export async function saveCorporateAction(input: unknown): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = corporateInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await saveAdvisorCorporate(userId, parsed.data);
  if (result.ok) {
    refreshAdvisor();
  }

  return result;
}

export async function saveServicesAction(input: unknown): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = servicesInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await saveAdvisorServices(userId, parsed.data);
  if (result.ok) {
    refreshAdvisor();
  }

  return result;
}

export async function saveDealsAction(input: unknown): Promise<AdvisorSaveResult> {
  const userId = await advisorUserId();

  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = dealsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await saveAdvisorDeals(userId, parsed.data);
  if (result.ok) {
    refreshAdvisor();
  }

  return result;
}
