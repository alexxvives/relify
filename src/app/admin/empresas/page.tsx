import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCompanies } from "@/components/admin-companies";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminCompanies } from "@/server/listAdminCompanies";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.companiesTitle,
  robots: { index: false, follow: false },
};

export default async function AdminCompaniesPage() {
  const user = await requireRole("admin");
  const projects = await listAdminCompanies(user);

  if (!projects) {
    notFound();
  }

  return (
    <SignedInPage title={adminCopy.companiesTitle} showTitle={false}>
      <AdminCompanies projects={projects} />
    </SignedInPage>
  );
}
