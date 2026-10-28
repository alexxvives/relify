import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdvisorEngagementView } from "@/components/advisor-engagement-view";
import { SignedInPage } from "@/components/signed-in-page";
import { engagementCopy } from "@/lib/engagement-copy";
import { madridToday } from "@/lib/meeting";
import { getAdvisorEngagement } from "@/server/advisoryEngagement";
import { getEngagementThread } from "@/server/engagementThread";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: "Encargos",
  robots: { index: false, follow: false },
};

export default async function AdvisorEngagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string; deposito?: string; suscripcion?: string }>;
}) {
  const user = await requireRole("advisor");
  const { id } = await params;
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    const applied = await fulfillCheckout(query.session_id, user.id);
    redirect(
      applied.ok
        ? `/mandatos/encargos/${id}?${applied.kind === "advisor_inbox" ? "suscripcion=1" : "deposito=1"}`
        : `/mandatos/encargos/${id}?deposito=0`,
    );
  }

  const engagement = await getAdvisorEngagement(user, id);

  if (!engagement) {
    // Old "Avisos" links can point at an encargo that was declined, withdrawn
    // or reassigned. Land on the encargos list instead of a 404.
    redirect("/mandatos/encargos");
  }

  const thread = engagement.deposit.paid || engagement.closed ? await getEngagementThread(user, id) : null;
  const notice = query.suscripcion === "1" ? engagementCopy.subscriptionPaidNote : query.deposito === "1" ? engagementCopy.depositPaidNote : query.deposito === "0" ? engagementCopy.depositFailed : null;

  return (
    <SignedInPage title={engagement.codename} showTitle={false}>
      <AdvisorEngagementView engagement={engagement} thread={thread} today={madridToday(new Date())} notice={notice} />
    </SignedInPage>
  );
}
