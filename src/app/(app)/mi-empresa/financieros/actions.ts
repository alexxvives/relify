"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/server/getCurrentUser";
import { confirmFiling, deleteFiling, type FilingFailure, type FilingSummary } from "@/server/financialFilings";

export type FilingActionResult = { ok: true; filing?: FilingSummary } | { ok: false; code: FilingFailure };

export async function deleteFilingAction(year: number): Promise<FilingActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, code: "forbidden" };
  }

  const result = await deleteFiling(user, Number(year));
  revalidatePath("/mi-empresa/financieros");
  return result.ok ? { ok: true } : result;
}

export async function confirmFilingAction(input: {
  year: number;
  amounts: Record<string, string>;
  cnae: string;
  averageHeadcount: string;
}): Promise<FilingActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, code: "forbidden" };
  }

  const result = await confirmFiling(user, input);

  if (result.ok) {
    revalidatePath("/mi-empresa/financieros");
    revalidatePath("/mi-empresa/detalles");
    revalidatePath("/mi-empresa");
  }

  return result.ok ? { ok: true, filing: result.filing } : result;
}
