import type { Metadata } from "next";
import { AdvisorHome } from "@/components/advisor-home";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy, advisorGreeting } from "@/lib/advisor-copy";
import { advisorProfileChecks } from "@/lib/advisor-profile";
import { getAdvisorDesk } from "@/server/advisoryEngagement";
import { getAdvisorProfile } from "@/server/getAdvisorProfile";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { listNotifications } from "@/server/listNotifications";
import { listPublishedSectors } from "@/server/listPublishedSectors";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function MandatesPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireRole("advisor");
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    await fulfillCheckout(query.session_id, user.id);
  }

  const [notifications, desk, profile, sectors] = await Promise.all([
    listNotifications(user.id),
    getAdvisorDesk(user.id),
    getAdvisorProfile(user.id),
    listPublishedSectors(),
  ]);
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <SignedInPage title={advisorGreeting(firstName)} showTitle>
      <AdvisorHome notifications={notifications} desk={desk} profileChecks={advisorProfileChecks(profile)} sectors={sectors} />
    </SignedInPage>
  );
}
