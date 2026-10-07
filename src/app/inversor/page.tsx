import type { Metadata } from "next";
import { InvestorHome } from "@/components/investor-home";
import { SignedInPage } from "@/components/signed-in-page";
import { investorCopy } from "@/lib/investor-copy";
import { sellerGreeting } from "@/lib/seller-copy";
import { loadBuyerPlan } from "@/server/buyerPlan";
import { loadInvestorDesk } from "@/server/investorDesk";
import { listNotifications } from "@/server/listNotifications";
import { listPublishedSectors } from "@/server/listPublishedSectors";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: investorCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function InvestorHomePage() {
  const user = await requireRole("investor");
  const [notifications, billing, sectors] = await Promise.all([
    listNotifications(user.id),
    loadBuyerPlan(user.id),
    listPublishedSectors(),
  ]);
  const desk = await loadInvestorDesk(user.id, user.email, billing.plan);

  return (
    <SignedInPage title={sellerGreeting(user.displayName)}>
      <InvestorHome
        notifications={notifications}
        favorites={desk.favorites}
        interests={desk.interests}
        questions={desk.questions}
        meetings={desk.meetings}
        profileChecks={desk.profileChecks}
        sectors={sectors}
      />
    </SignedInPage>
  );
}
