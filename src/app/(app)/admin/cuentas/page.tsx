import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminAccounts } from "@/components/admin-accounts";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminAccounts } from "@/server/listAdminAccounts";
import { markAdminSeen } from "@/server/adminSeen";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.accountsTitle,
  robots: { index: false, follow: false },
};

async function AdminAccountsPageContent() {
  const user = await requireRole("admin");
  const since = await markAdminSeen(user.id, "cuentas");
  const accounts = await listAdminAccounts(user, since);

  if (!accounts) {
    notFound();
  }

  return (
    <>
      <AdminAccounts accounts={accounts} viewerId={user.id} />
    </>
  );
}

export default function AdminAccountsPage() {
  return (
    <SignedInPage title={adminCopy.accountsTitle} showTitle={false}>
      <Suspense fallback={<AdminListSkeleton kind="accounts" />}>
        <AdminAccountsPageContent />
      </Suspense>
    </SignedInPage>
  );
}
