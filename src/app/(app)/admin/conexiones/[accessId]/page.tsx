import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCompany } from "@/components/admin-company";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { madridToday } from "@/lib/meeting";
import { getAdminCompanyByAccess } from "@/server/getAdminCompany";
import { adminTeaserDesk } from "@/server/companyPdfs";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.connectionsTitle,
  robots: { index: false, follow: false },
};

export default async function AdminConnectionPage({ params }: { params: Promise<{ accessId: string }> }) {
  const user = await requireRole("admin");
  const { accessId } = await params;
  const view = await getAdminCompanyByAccess(user, accessId);

  if (!view) {
    notFound();
  }

  const teaserDesk = await adminTeaserDesk(view.profile.slug);

  return (
    <SignedInPage title={view.profile.codename} showTitle={false}>
      <AdminCompany
        view={view}
        teaserDesk={teaserDesk}
        backHref="/admin/conexiones"
        backLabel={adminCopy.chatBack}
        today={madridToday(new Date())}
      />
    </SignedInPage>
  );
}
