import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminAccounts } from "@/components/admin-accounts";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminAccounts } from "@/server/listAdminAccounts";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.accountsTitle,
  robots: { index: false, follow: false },
};

export default async function AdminAccountsPage() {
  const user = await requireRole("admin");
  const accounts = await listAdminAccounts(user);

  if (!accounts) {
    notFound();
  }

  return (
    <SignedInPage title={adminCopy.accountsTitle} showTitle={false}>
      <AdminAccounts accounts={accounts} viewerId={user.id} />
    </SignedInPage>
  );
}
