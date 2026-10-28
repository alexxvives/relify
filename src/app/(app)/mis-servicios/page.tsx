import { Suspense } from "react";
import { AdvisorServicesSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { AdvisorServices } from "@/components/advisor-services";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { listAdvisorPlatformCloses } from "@/server/advisoryEngagement";
import { getAdvisorProfile } from "@/server/getAdvisorProfile";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.servicesTitle,
  robots: { index: false, follow: false },
};

async function AdvisorServicesPageContent() {
  const user = await requireRole("advisor");
  const [profile, closes] = await Promise.all([getAdvisorProfile(user.id), listAdvisorPlatformCloses(user.id)]);

  return (
    <>
      <AdvisorServices initial={profile} closes={closes} />
    </>
  );
}

export default function AdvisorServicesPage() {
  return (
    <SignedInPage title={advisorCopy.servicesTitle}>
      <Suspense fallback={<AdvisorServicesSkeleton />}>
        <AdvisorServicesPageContent />
      </Suspense>
    </SignedInPage>
  );
}
