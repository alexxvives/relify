import { Suspense } from "react";
import { AdvisorHomeSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { AdvisorHome } from "@/components/advisor/advisor-home";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { advisorProfileChecks } from "@/lib/advisor-profile";
import { getAdvisorDesk } from "@/lib/server/advisory-engagement";
import { getAdvisorProfile } from "@/lib/server/get-advisor-profile";
import { fulfillCheckout } from "@/lib/server/fulfill-checkout";
import { listNotifications } from "@/lib/server/list-notifications";
import { listPublishedSectors } from "@/lib/server/list-published-sectors";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: advisorCopy.homeTitle,
  robots: { index: false, follow: false },
};

async function MandatesPageContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireRole("advisor");
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    await fulfillCheckout(query.session_id, user.id);
  }

  const [notifications, desk, profile, sectors] = await Promise.all([
    listNotifications(user.id),
    getAdvisorDesk(user.id),
    getAdvisorProfile(user.id),
    listPublishedSectors(),
  ]);
  return (
    <>
      <AdvisorHome notifications={notifications} desk={desk} profileChecks={advisorProfileChecks(profile)} sectors={sectors} />
    </>
  );
}

export default function MandatesPage(props: Parameters<typeof MandatesPageContent>[0]) {
  return (
    <SignedInPage title={advisorCopy.homeTitle} showTitle={false}>
      <Suspense fallback={<AdvisorHomeSkeleton />}>
        <MandatesPageContent {...props} />
      </Suspense>
    </SignedInPage>
  );
}
