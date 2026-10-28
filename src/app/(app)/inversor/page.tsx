import { Suspense } from "react";
import { InvestorHomeSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { InvestorHome } from "@/components/investor-home";
import { SignedInPage } from "@/components/signed-in-page";
import { homePendingActions } from "@/lib/deal-pipeline";
import { investorCopy } from "@/lib/investor-copy";
import { loadInvestorDesk } from "@/server/investorDesk";
import { listNotifications } from "@/server/listNotifications";
import { listPublishedSectors } from "@/server/listPublishedSectors";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: investorCopy.homeTitle,
  robots: { index: false, follow: false },
};

async function InvestorHomePageContent() {
  const user = await requireRole("investor");
  const [notifications, sectors, desk] = await Promise.all([
    listNotifications(user.id),
    listPublishedSectors(),
    loadInvestorDesk(user.id, user.email),
  ]);

  return (
    <>
      <InvestorHome
        notifications={notifications}
        favorites={desk.favorites}
        interests={desk.interests}
        questions={desk.questions}
        meetings={desk.meetings}
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
