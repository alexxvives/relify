import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdvisorEngagementView } from "@/components/advisor-engagement-view";
import { SignedInPage } from "@/components/signed-in-page";
import { engagementCopy } from "@/lib/engagement-copy";
import { madridToday } from "@/lib/meeting";
import { getAdvisorEngagement } from "@/server/advisoryEngagement";
import { getEngagementThread } from "@/server/engagementThread";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: engagementCopy.mineTitle,
  robots: { index: false, follow: false },
};

export default async function AdvisorEngagementPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("advisor");
  const { id } = await params;
  const [engagement, thread] = await Promise.all([getAdvisorEngagement(user, id), getEngagementThread(user, id)]);

  if (!engagement) {
    notFound();
  }

  return (
    <SignedInPage title={engagement.codename}>
      <AdvisorEngagementView engagement={engagement} thread={thread} today={madridToday(new Date())} />
    </SignedInPage>
  );
}
