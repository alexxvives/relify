import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubscriptionDeskView } from "@/components/investor/subscription-desk";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { billingCopy } from "@/lib/billing-copy";
import { requireRole } from "@/lib/server/require-role";
import { applyCardSetup, loadSubscriptionDesk } from "@/lib/server/subscription-desk";

export const metadata: Metadata = {
  title: billingCopy.manageTitle,
  robots: { index: false, follow: false },
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ setup_session?: string; card?: string }>;
}) {
  const user = await requireRole("investor");
  const query = await searchParams;

  if (typeof query.setup_session === "string" && query.setup_session !== "") {
    const applied = await applyCardSetup(user.id, query.setup_session);
    redirect(applied.ok ? "/premium/suscripcion?card=1" : "/premium/suscripcion?card=0");
  }

  const desk = await loadSubscriptionDesk(user.id, user.email);
  const notice = query.card === "1" ? billingCopy.cardSaved : query.card === "0" ? billingCopy.stripeFailed : null;

  return (
    <SignedInPage title={billingCopy.manageTitle} showTitle={false}>
      <SubscriptionDeskView desk={desk} notice={notice} />
    </SignedInPage>
  );
}
