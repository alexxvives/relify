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

export default async function AdminConnectionsPage() {
  const user = await requireRole("admin");
  const connections = await listAdminConnections(user);

  if (!connections) {
    notFound();
  }

  return (
    <SignedInPage title={adminCopy.connectionsTitle} showTitle={false}>
      <AdminConnections connections={connections} />
    </SignedInPage>
  );
}
