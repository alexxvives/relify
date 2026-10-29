import { Suspense } from "react";
import { AdminListSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCompanies } from "@/components/admin-companies";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminCompanies } from "@/server/listAdminCompanies";
import { markAdminSeen } from "@/server/adminSeen";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.companiesTitle,
  robots: { index: false, follow: false },
};

async function AdminCompaniesPageContent({ searchParams }: { searchParams: Promise<{ sabi?: string }> }) {
  const query = await searchParams;
  const user = await requireRole("admin");
  const since = await markAdminSeen(user.id, "empresas");
  const projects = await listAdminCompanies(user, since);

  if (!projects) {
    notFound();
  }

  return (
    <>
      <AdminCompanies projects={projects} sabiOnly={query.sabi === "pendiente"} />
    </>
  );
}

export default function AdminCompaniesPage(props: { searchParams: Promise<{ sabi?: string }> }) {
  return (
    <SignedInPage title={adminCopy.companiesTitle} showTitle={false}>
      <Suspense fallback={<AdminListSkeleton kind="companies" />}>
        <AdminCompaniesPageContent searchParams={props.searchParams} />
      </Suspense>
    </SignedInPage>
  );
}
