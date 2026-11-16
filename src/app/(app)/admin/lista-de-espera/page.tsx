import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminWaitlist } from "@/components/admin/admin-waitlist";
import { AdminListSkeleton } from "@/components/shell/page-skeletons";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { markAdminSeen } from "@/lib/server/admin-seen";
import { listWaitlist } from "@/lib/server/list-waitlist";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = { title: "Lista de espera", robots: { index: false, follow: false } };

async function Entries() {
  const user = await requireRole("admin");
  await markAdminSeen(user.id, "waitlist");
  const entries = await listWaitlist(user);
  return <AdminWaitlist entries={entries} />;
}

export default function AdminWaitlistPage() {
  return (
    <SignedInPage title="Lista de espera" showTitle={false}>
      <Suspense fallback={<AdminListSkeleton kind="waitlist" />}>
        <Entries />
      </Suspense>
    </SignedInPage>
  );
}
