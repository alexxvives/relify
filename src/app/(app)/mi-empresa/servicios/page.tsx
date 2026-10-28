import { Suspense } from "react";
import { AdvisorySkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdvisoryPicker } from "@/components/advisory-picker";
import { SignedInPage } from "@/components/signed-in-page";
import { selectedEngagementCompany } from "@/lib/advisor-directory";
import { sellerCopy } from "@/lib/seller-copy";
import { listPublicAdvisors } from "@/server/listPublicAdvisors";
import { requireRole } from "@/server/requireRole";
import { listSellerAdvisoryCompanies } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.servicesTitle,
  robots: { index: false, follow: false },
};

async function SellerServicesPageContent({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const query = await searchParams;
  const [advisors, companies] = await Promise.all([
    listPublicAdvisors(),
    listSellerAdvisoryCompanies(user.id),
  ]);

  return (
    <>
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6">
        <AdvisoryPicker
          key={selectedEngagementCompany(companies, query.empresa) || "empresa"}
          layout="cards"
          advisors={advisors}
          companies={companies}
          initialCompany={selectedEngagementCompany(companies, query.empresa)}
        />
      </section>
    </>
  );
}

export default function SellerServicesPage(props: Parameters<typeof SellerServicesPageContent>[0]) {
  return (
    <SignedInPage title={sellerCopy.servicesHeading}>
      <Suspense fallback={<AdvisorySkeleton />}>
        <SellerServicesPageContent {...props} />
      </Suspense>
    </SignedInPage>
  );
}
