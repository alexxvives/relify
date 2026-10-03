import type { Metadata } from "next";
import { AdvisorServices } from "@/components/advisor-services";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { getAdvisorProfile } from "@/server/getAdvisorProfile";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.servicesTitle,
  robots: { index: false, follow: false },
};

export default async function AdvisorServicesPage() {
  const user = await requireRole("advisor");
  const profile = await getAdvisorProfile(user.id);

  return (
    <SignedInPage title={advisorCopy.servicesTitle}>
      <AdvisorServices initial={profile} />
    </SignedInPage>
  );
}
