import { referralSourceLabel } from "@/lib/auth-input";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type AdminAccountRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  onboarded: boolean;
  suspended: boolean;
  plan: "none" | "limited" | "unlimited";
  referralSource: string | null;
};

export async function listAdminAccounts(user: CurrentUser): Promise<AdminAccountRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const accounts = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      role: true,
      onboardedAt: true,
      suspendedAt: true,
      referralSource: true,
      billingCustomer: { select: { plan: true } },
    },
  });

  return accounts.map((account) => ({
    id: account.id,
    name: [account.name, account.lastName].filter((part) => part && part.trim().length > 0).join(" "),
    email: account.email,
    role: account.role,
    onboarded: account.onboardedAt !== null,
    suspended: account.suspendedAt !== null,
    plan: account.billingCustomer?.plan ?? "none",
    referralSource: referralSourceLabel(account.referralSource),
  }));
}
