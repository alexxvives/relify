import type { Metadata } from "next";
import { InvestorProfile } from "@/components/investor-profile";
import { SignedInPage } from "@/components/signed-in-page";
import { demoInvestorProfile } from "@/lib/demo-profile";
import { investorCopy } from "@/lib/investor-copy";
import { loadInvestorDraft } from "@/server/investorProfile";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: investorCopy.profileTitle,
  robots: { index: false, follow: false },
};

export default async function InvestorProfilePage() {
  const user = await requireRole("investor");
  const draft = await loadInvestorDraft(user.id, user.email);

  return (
    <SignedInPage title={investorCopy.profileTitle}>
      <InvestorProfile displayName={user.displayName} initial={demoInvestorProfile(user.email)} draft={draft} />
    </SignedInPage>
  );
}
