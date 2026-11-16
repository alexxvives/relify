import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminAdvisors } from "@/components/admin/admin-advisors";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminAdvisors } from "@/lib/server/list-admin-advisors";
import { markAdminSeen } from "@/lib/server/admin-seen";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: adminCopy.advisorsTitle,
  robots: { index: false, follow: false },
};

async function AdminAdvisorsPageContent() {
  const user = await requireRole("admin");
  const since = await markAdminSeen(user.id, "asesores");
  const advisors = await listAdminAdvisors(user, since);

  if (!advisors) {
    notFound();
  }

  return (
    <>
      <AdminAdvisors advisors={advisors} />
    </>
  );
}

export default function AdminAdvisorsPage() {
  return (
    <SignedInPage title={adminCopy.advisorsTitle} showTitle={false}>
      <Suspense fallback={<AdminListSkeleton kind="advisors" />}>
        <AdminAdvisorsPageContent />
      </Suspense>
    </SignedInPage>
  );
}
