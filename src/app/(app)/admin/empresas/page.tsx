import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCompanies } from "@/components/admin/admin-companies";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminCompanies } from "@/lib/server/list-admin-companies";
import { markAdminSeen } from "@/lib/server/admin-seen";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: adminCopy.companiesTitle,
  robots: { index: false, follow: false },
};

async function AdminCompaniesPageContent() {
  const user = await requireRole("admin");
  const since = await markAdminSeen(user.id, "empresas");
  const projects = await listAdminCompanies(user, since);

  if (!projects) {
    notFound();
  }

  return <AdminCompanies projects={projects} />;
}

export default function AdminCompaniesPage() {
  return (
    <SignedInPage title={adminCopy.companiesTitle} showTitle={false}>
      <Suspense fallback={<AdminListSkeleton kind="companies" />}>
        <AdminCompaniesPageContent />
      </Suspense>
    </SignedInPage>
  );
}
