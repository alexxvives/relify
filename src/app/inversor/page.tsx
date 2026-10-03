import type { Metadata } from "next";
import { InvestorHome } from "@/components/investor-home";
import { SignedInPage } from "@/components/signed-in-page";
import { investorCopy } from "@/lib/investor-copy";
import { sellerGreeting } from "@/lib/seller-copy";
import { listNotifications } from "@/server/listNotifications";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: investorCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function InvestorHomePage() {
  const user = await requireRole("investor");
  const notifications = await listNotifications(user.id);

  return (
    <SignedInPage title={sellerGreeting(user.displayName)}>
      <InvestorHome notifications={notifications} />
    </SignedInPage>
  );
}
