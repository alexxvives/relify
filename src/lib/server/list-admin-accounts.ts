import { referralSourceLabel } from "@/lib/auth-input";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

export type AdminAccountRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  onboarded: boolean;
  suspended: boolean;
  plan: "none" | "limited" | "unlimited";
  referralSource: string | null;
  phone: string | null;
  companies: number;
  createdAt: string;
  isNew: boolean;
};

export async function listAdminAccounts(
  user: CurrentUser,
  since?: Date,
): Promise<AdminAccountRow[] | null> {
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
      createdAt: true,
      phone: true,
      billingCustomer: { select: { plan: true } },
      _count: { select: { projects: true } },
    },
  });

  return accounts.map((account) => ({
    id: account.id,
    name: [account.name, account.lastName]
      .filter((part) => part && part.trim().length > 0)
      .join(" "),
    email: account.email,
    role: account.role,
    onboarded: account.onboardedAt !== null,
    suspended: account.suspendedAt !== null,
    plan: account.billingCustomer?.plan ?? "none",
    referralSource: referralSourceLabel(account.referralSource),
    phone: account.phone,
    companies: account._count.projects,
    createdAt: account.createdAt.toISOString(),
    isNew: since ? account.createdAt > since : false,
  }));
}
