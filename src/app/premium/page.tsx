import type { Metadata } from "next";
import { PremiumPlans } from "@/components/premium-plans";
import { SignedInPage } from "@/components/signed-in-page";
import { billingCopy } from "@/lib/billing-copy";
import { loadBuyerPlan } from "@/server/buyerPlan";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: billingCopy.title,
  robots: { index: false, follow: false },
};

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireRole("investor");
  const query = await searchParams;
  let notice: string | null = null;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    const fulfilled = await fulfillCheckout(query.session_id, user.id);
    notice = fulfilled.ok ? billingCopy.paid : fulfilled.message;
  }

  const billing = await loadBuyerPlan(user.id);

  return (
    <SignedInPage title={billingCopy.title}>
      <PremiumPlans plan={billing.plan} notice={notice} />
    </SignedInPage>
  );
}
