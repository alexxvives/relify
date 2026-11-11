import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCompany } from "@/components/admin-company";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { madridToday } from "@/lib/meeting";
import { getAdminCompany } from "@/server/getAdminCompany";
import { adminTeaserDesk } from "@/server/companyPdfs";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.companiesTitle,
  robots: { index: false, follow: false },
};

export default async function AdminCompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ acceso?: string | string[] }>;
}) {
  const user = await requireRole("admin");
  const { slug } = await params;
  const query = await searchParams;
  const raw = Array.isArray(query.acceso) ? query.acceso[0] : query.acceso;
  const accessId = raw ?? null;
  const view = await getAdminCompany(user, { slug, accessId });

  if (!view) {
    notFound();
  }

  const teaserDesk = await adminTeaserDesk(view.profile.slug);

  return (
    <SignedInPage title={view.profile.codename} showTitle={false}>
      <AdminCompany
        view={view}
        teaserDesk={teaserDesk}
        backHref={accessId ? "/admin/conexiones" : "/admin/empresas"}
        backLabel={accessId ? adminCopy.chatBack : adminCopy.companyBack}
        today={madridToday(new Date())}
      />
    </SignedInPage>
  );
}
