import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminAccounts } from "@/components/admin/admin-accounts";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminAccounts } from "@/lib/server/list-admin-accounts";
import { markAdminSeen, recentSince } from "@/lib/server/admin-seen";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: adminCopy.accountsTitle,
  robots: { index: false, follow: false },
};

async function AdminAccountsPageContent() {
  const user = await requireRole("admin");
  await markAdminSeen(user.id, "cuentas");
  const accounts = await listAdminAccounts(user, recentSince());

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
