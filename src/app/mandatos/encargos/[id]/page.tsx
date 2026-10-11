import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdvisorEngagementView } from "@/components/advisor-engagement-view";
import { SignedInPage } from "@/components/signed-in-page";
import { engagementCopy } from "@/lib/engagement-copy";
import { madridToday } from "@/lib/meeting";
import { getAdvisorEngagement } from "@/server/advisoryEngagement";
import { getEngagementThread } from "@/server/engagementThread";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: engagementCopy.mineTitle,
  robots: { index: false, follow: false },
};

export default async function AdvisorEngagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string; deposito?: string }>;
}) {
  const user = await requireRole("advisor");
  const { id } = await params;
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    const applied = await fulfillCheckout(query.session_id, user.id);
    redirect(applied.ok ? `/mandatos/encargos/${id}?deposito=1` : `/mandatos/encargos/${id}?deposito=0`);
  }

  const engagement = await getAdvisorEngagement(user, id);

  if (!engagement) {
    notFound();
  }

  const thread = engagement.deposit.paid || engagement.closed ? await getEngagementThread(user, id) : null;
  const notice = query.deposito === "1" ? engagementCopy.depositPaidNote : query.deposito === "0" ? engagementCopy.depositFailed : null;

  return (
    <SignedInPage title={engagement.codename} showTitle={false}>
      <AdvisorEngagementView engagement={engagement} thread={thread} today={madridToday(new Date())} notice={notice} />
    </SignedInPage>
  );
}
