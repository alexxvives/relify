import {
  maxAnnualAccountsBytes,
  parseAnnualAccounts,
  type AnnualAccountsParse,
} from "@/lib/annual-accounts";
import type { CurrentUser } from "@/lib/server/get-current-user";

export type AnnualAccountsRead =
  | AnnualAccountsParse
  | { ok: false; code: "forbidden" | "empty" | "too-large" };

export async function readAnnualAccounts(
  user: CurrentUser,
  bytes: Uint8Array,
  fileName: string,
): Promise<AnnualAccountsRead> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, code: "forbidden" };
  }

  if (bytes.byteLength === 0) {
    return { ok: false, code: "empty" };
  }

  if (bytes.byteLength > maxAnnualAccountsBytes) {
    return { ok: false, code: "too-large" };
  }

  return parseAnnualAccounts(bytes, fileName);
}
