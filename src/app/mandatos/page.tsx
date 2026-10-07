import type { Metadata } from "next";
import { AdvisorHome } from "@/components/advisor-home";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy, advisorGreeting } from "@/lib/advisor-copy";
import { getAdvisorProfile } from "@/server/getAdvisorProfile";
import { listNotifications } from "@/server/listNotifications";
import { listPendingMatches } from "@/server/listPendingMatches";
import { listSaleMandates } from "@/server/listSaleMandates";
import { fulfillCheckout } from "@/server/fulfillCheckout";
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

  const [profile, notifications, mandates, pending] = await Promise.all([
    getAdvisorProfile(user.id),
    listNotifications(user.id),
    listSaleMandates(user.id),
    listPendingMatches(user.id),
  ]);
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <SignedInPage title={advisorGreeting(firstName)} showTitle>
      <AdvisorHome
        notifications={notifications}
        profileReady={profile.corporateComplete}
        mandates={mandates}
        pending={pending}
      />
    </SignedInPage>
  );
}
