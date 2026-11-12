import { Suspense } from "react";
import { AdvisorySkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdvisoryPicker } from "@/components/advisor/advisory-picker";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { selectedEngagementCompany } from "@/lib/advisor-directory";
import { sellerCopy } from "@/lib/seller-copy";
import { listPublicAdvisors } from "@/lib/server/list-public-advisors";
import { requireRole } from "@/lib/server/require-role";
import { listSellerAdvisoryCompanies } from "@/lib/server/seller-company";
import { companyNifIsVerified } from "@/lib/server/verify-company-nif";

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
      {/* t93: same shared picker as /asesoramiento, cards directly on the page (no wrapper card). */}
      <AdvisoryPicker
        key={selectedEngagementCompany(companies, query.empresa) || "empresa"}
        layout="cards"
        advisors={advisors}
        companies={companies}
        initialCompany={selectedEngagementCompany(companies, query.empresa)}
      />
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
