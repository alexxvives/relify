"use server";

import { valuationCopy, valuationRequestSchema } from "@/lib/valuation-request";
import { createValuationRequest } from "@/server/createValuationRequest";
import { clientIp, takeThrottle } from "@/server/emailThrottle";
import { getCurrentUser } from "@/server/getCurrentUser";

export type ValuationState = { status: "idle" } | { status: "ok" } | { status: "error"; message: string };

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function requestValuationAction(_state: ValuationState, formData: FormData): Promise<ValuationState> {
  const parsed = valuationRequestSchema.safeParse({
    cif: readText(formData, "cif"),
    contactName: readText(formData, "contactName"),
    contactEmail: readText(formData, "contactEmail"),
    phone: readText(formData, "phone"),
  });

  if (!parsed.success) {
    const cifIssue = parsed.error.issues.some((issue) => issue.path[0] === "cif");
    return { status: "error", message: cifIssue ? valuationCopy.invalidCif : valuationCopy.invalid };
  }

  if (!(await takeThrottle(`valuation:ip:${await clientIp()}`, 8, 60 * 60, false))) {
    return { status: "error", message: valuationCopy.throttled };
  }

  const linkAccount = readText(formData, "linkAccount") === "on";
  const user = linkAccount ? await getCurrentUser() : null;

  const result = await createValuationRequest(parsed.data, user?.id ?? null);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return { status: "ok" };
}
