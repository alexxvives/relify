import type { Metadata } from "next";
import { PremiumPlans } from "@/components/investor/premium-plans";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { billingCopy } from "@/lib/billing-copy";
import { loadBuyerPlan, loadStoredBuyerPlan } from "@/lib/server/buyer-plan";
import { launchFreeMode } from "@/lib/launch-mode";
import { fulfillCheckout } from "@/lib/server/fulfill-checkout";
import { isIntEnvironment } from "@/lib/int-env";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: billingCopy.title,
  robots: { index: false, follow: false },
};

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; changed?: string }>;
}) {
  const user = await requireRole("investor");
  const query = await searchParams;
  let notice: string | null = null;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    const fulfilled = await fulfillCheckout(query.session_id, user.id);
    notice = fulfilled.ok ? billingCopy.paid : fulfilled.message;
  } else if (query.changed === "1") {
    notice = billingCopy.planChanged;
  }

  const [billing, stored] = await Promise.all([loadBuyerPlan(user.id), loadStoredBuyerPlan(user.id)]);

  return (
    <SignedInPage title={billingCopy.title}>
      <PremiumPlans plan={billing.plan} notice={notice} testMode={isIntEnvironment()} launchFree={launchFreeMode()} manageable={stored.plan !== "none"} />
    </SignedInPage>
  );
}
