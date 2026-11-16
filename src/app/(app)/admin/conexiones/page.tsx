import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminConnections } from "@/components/admin/admin-connections";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminConnections } from "@/lib/server/list-admin-connections";
import { markAdminSeen } from "@/lib/server/admin-seen";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: adminCopy.connectionsTitle,
  robots: { index: false, follow: false },
};

async function AdminConnectionsPageContent() {
  const user = await requireRole("admin");
  const since = await markAdminSeen(user.id, "conexiones");
  const connections = await listAdminConnections(user, since);

  if (!connections) {
    notFound();
  }

  return (
    <>
      <AdminConnections connections={connections} />
    </>
  );
}

export default function AdminConnectionsPage() {
  return (
    <SignedInPage title={adminCopy.connectionsTitle} showTitle={false}>
      <Suspense fallback={<AdminListSkeleton kind="connections" />}>
        <AdminConnectionsPageContent />
      </Suspense>
    </SignedInPage>
  );
}
