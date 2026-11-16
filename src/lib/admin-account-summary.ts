export type AdminAccountSummaryInput = {
  role: string | null;
  onboarded: boolean;
  suspended: boolean;
  plan: "none" | "limited" | "unlimited";
};

export function adminAccountSummary(accounts: readonly AdminAccountSummaryInput[]) {
  const summary = {
    total: accounts.length,
    seller: 0,
    investor: 0,
    advisor: 0,
    pending: 0,
    suspended: 0,
    none: 0,
    limited: 0,
    unlimited: 0,
  };

  for (const account of accounts) {
    if (account.role === "seller") summary.seller += 1;
    if (account.role === "investor") summary.investor += 1;
    if (account.role === "advisor") summary.advisor += 1;
    if (!account.onboarded) summary.pending += 1;
    if (account.suspended) summary.suspended += 1;
    if (account.role === "investor") summary[account.plan] += 1;
  }

  return summary;
}
