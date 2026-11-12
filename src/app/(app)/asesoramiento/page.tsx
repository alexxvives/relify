import { Suspense } from "react";
import { AdvisorySkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { AdvisoryPicker } from "@/components/advisor/advisory-picker";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { selectedEngagementCompany } from "@/lib/advisor-directory";
import { advisoryCopy } from "@/lib/advisory";
import { listInvestorNdaCompanies } from "@/lib/server/list-investor-nda-companies";
import { listPublicAdvisors } from "@/lib/server/list-public-advisors";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: advisoryCopy.title,
  robots: { index: false, follow: false },
};

async function AdvisoryPageContent({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const user = await requireRole("investor");
  const query = await searchParams;
  const [advisors, companies] = await Promise.all([
    listPublicAdvisors(),
    listInvestorNdaCompanies(user.id),
  ]);

  return (
    <>
      {/* t91: cards sit directly on the page, like the companies marketplace. */}
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

export default function AdvisoryPage(props: Parameters<typeof AdvisoryPageContent>[0]) {
  return (
    <SignedInPage title={advisoryCopy.title}>
      <Suspense fallback={<AdvisorySkeleton />}>
        <AdvisoryPageContent {...props} />
      </Suspense>
    </SignedInPage>
  );
}
