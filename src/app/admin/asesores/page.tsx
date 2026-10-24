import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminAdvisors } from "@/components/admin-advisors";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminAdvisors } from "@/server/listAdminAdvisors";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.advisorsTitle,
  robots: { index: false, follow: false },
};

async function AdminAdvisorsPageContent() {
  const user = await requireRole("admin");
  const advisors = await listAdminAdvisors(user);

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
