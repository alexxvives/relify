import { Suspense } from "react";
import { AdminHomeSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHome } from "@/components/admin-home";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { getAdminDashboard } from "@/server/getAdminDashboard";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.homeTitle,
  robots: { index: false, follow: false },
};

async function AdminPageContent() {
  const user = await requireRole("admin");
  const overview = await getAdminDashboard(user);

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
    <SignedInPage title={adminCopy.homeTitle} greeting>
      <Suspense fallback={<AdminHomeSkeleton />}>
        <AdminPageContent />
      </Suspense>
    </SignedInPage>
  );
}
