"use server";

import { redirect } from "next/navigation";
import { companyCopy } from "@/lib/company-copy";
import { centsToEuroInput } from "@/lib/company-draft";
import type { BalanceInputKey, PnlInputKey } from "@/lib/company-profile";
import { getCurrentUser } from "@/server/getCurrentUser";
import { readAnnualAccounts, type AnnualAccountsRead } from "@/server/readAnnualAccounts";

export type AccountsStatement = {
  year: number;
  pnl: Partial<Record<PnlInputKey, string>>;
  balance: Partial<Record<BalanceInputKey, string>>;
};

export type AnnualAccountsState =
  | { ok: true; notice: string; revenue: string; ebitda: string; statements: AccountsStatement[] }
  | { ok: false; message: string };

export async function readAnnualAccountsAction(formData: FormData): Promise<AnnualAccountsState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const file = formData.get("accounts");

  if (!(file instanceof File)) {
    return { ok: false, message: companyCopy.accountsEmpty };
  }

  const result = await readAnnualAccounts(user, new Uint8Array(await file.arrayBuffer()), file.name);

  if (!result.ok) {
    return { ok: false, message: failureMessage(result.code) };
  }

  const statements = result.statements.map((statement) => ({
    year: statement.year,
    pnl: euroFields(statement.pnlCents),
    balance: euroFields(statement.balanceCents),
  }));
  const latest = result.statements[result.statements.length - 1];

  if (!latest) {
    return { ok: false, message: companyCopy.accountsNoSales };
  }

  return {
    ok: true,
    notice: companyCopy.accountsApplied.replace("{years}", yearList(statements.map((statement) => statement.year))),
    revenue: centsToEuroInput(latest.salesCents),
    ebitda: latest.ebitdaCents === null ? "" : centsToEuroInput(latest.ebitdaCents),
    statements,
  };
}

function euroFields<Key extends string>(cents: Partial<Record<Key, number>>): Partial<Record<Key, string>> {
  const fields: Partial<Record<Key, string>> = {};

  for (const key of Object.keys(cents) as Key[]) {
    const value = cents[key];

    if (value !== undefined) {
      fields[key] = centsToEuroInput(value);
    }
  }

  return fields;
}

function yearList(years: number[]): string {
  const last = years[years.length - 1];

  if (last === undefined || years.length === 1) {
    return String(last ?? "");
  }

  return `${years.slice(0, -1).join(", ")} y ${last}`;
}

function failureMessage(code: Extract<AnnualAccountsRead, { ok: false }>["code"]): string {
  if (code === "forbidden") {
    return companyCopy.notSeller;
  }

  if (code === "empty") {
    return companyCopy.accountsEmpty;
  }

  if (code === "too-large") {
    return companyCopy.accountsTooLarge;
  }

  if (code === "pdf") {
    return companyCopy.accountsPdf;
  }

  if (code === "no-sales") {
    return companyCopy.accountsNoSales;
  }

  if (code === "no-year") {
    return companyCopy.accountsNoYear;
  }

  return companyCopy.accountsUnreadable;
}
