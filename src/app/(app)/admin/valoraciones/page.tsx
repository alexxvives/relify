import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminValoraciones } from "@/components/admin/admin-valoraciones";
import { AdminListSkeleton } from "@/components/shell/page-skeletons";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { valuationCopy } from "@/lib/valuation-request";
import { markAdminSeen } from "@/lib/server/admin-seen";
import { listValuationRequests } from "@/lib/server/list-valuation-requests";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = { title: valuationCopy.adminTitle, robots: { index: false, follow: false } };

async function Entries() {
  const user = await requireRole("admin");
  await markAdminSeen(user.id, "valoraciones");
  const entries = await listValuationRequests(user);
  return <AdminValoraciones entries={entries} />;
}

export default function AdminValuationsPage() {
  return (
    <SignedInPage title={valuationCopy.adminTitle} showTitle={false}>
      <Suspense fallback={<AdminListSkeleton kind="valoraciones" />}>
        <Entries />
      </Suspense>
    </SignedInPage>
  );
}
