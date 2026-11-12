import { Suspense } from "react";
import { InvestorHomeSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { InvestorHome } from "@/components/investor/investor-home";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { homePendingActions } from "@/lib/deal-pipeline";
import { investorCopy } from "@/lib/investor-copy";
import { loadInvestorDesk } from "@/lib/server/investor-desk";
import { investorFunnel } from "@/lib/server/activity-funnel";
import { listNotifications } from "@/lib/server/list-notifications";
import { listPublishedSectors } from "@/lib/server/list-published-sectors";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: investorCopy.homeTitle,
  robots: { index: false, follow: false },
};

async function InvestorHomePageContent() {
  const user = await requireRole("investor");
  const [notifications, sectors, desk, funnel] = await Promise.all([
    listNotifications(user.id),
    listPublishedSectors(),
    loadInvestorDesk(user.id, user.email),
    investorFunnel(user.id),
  ]);

  return (
    <>
      <InvestorHome
        notifications={notifications}
        funnel={funnel}
        processes={desk.processes}
        profileChecks={desk.profileChecks}
        sectors={sectors}
        pending={homePendingActions(
          "investor",
          desk.processes.map((process) => ({
            id: process.accessId,
            who: process.codename,
            href: "/procesos",
            steps: process.steps,
          })),
        )}
      />
    </>
  );
}

export default function InvestorHomePage() {
  return (
    <SignedInPage title={investorCopy.homeTitle} showTitle={false}>
      <Suspense fallback={<InvestorHomeSkeleton />}>
        <InvestorHomePageContent />
      </Suspense>
    </SignedInPage>
  );
}
