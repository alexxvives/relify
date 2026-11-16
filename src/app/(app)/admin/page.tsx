import { Suspense } from "react";
import { AdminHomeSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHome } from "@/components/admin/admin-home";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { getAdminDashboard } from "@/lib/server/get-admin-dashboard";
import { markAdminSeen } from "@/lib/server/admin-seen";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: adminCopy.homeTitle,
  robots: { index: false, follow: false },
};

async function AdminPageContent() {
  const user = await requireRole("admin");
  const since = await markAdminSeen(user.id, "home");
  const overview = await getAdminDashboard(user, since);

  if (!overview) {
    notFound();
  }

  return (
    <>
      <AdminHome overview={overview} />
    </>
  );
}

export default function AdminPage() {
  return (
    <SignedInPage title={adminCopy.homeTitle} showTitle={false}>
      <Suspense fallback={<AdminHomeSkeleton />}>
        <AdminPageContent />
      </Suspense>
    </SignedInPage>
  );
}
