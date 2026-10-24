import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminConnections } from "@/components/admin-connections";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminConnections } from "@/server/listAdminConnections";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.connectionsTitle,
  robots: { index: false, follow: false },
};

async function AdminConnectionsPageContent() {
  const user = await requireRole("admin");
  const connections = await listAdminConnections(user);

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
