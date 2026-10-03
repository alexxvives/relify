import type { Metadata } from "next";
import { AdvisorHome } from "@/components/advisor-home";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy, advisorGreeting } from "@/lib/advisor-copy";
import { getAdvisorProfile } from "@/server/getAdvisorProfile";
import { listNotifications } from "@/server/listNotifications";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function MandatesPage() {
  const user = await requireRole("advisor");
  const [profile, notifications] = await Promise.all([
    getAdvisorProfile(user.id),
    listNotifications(user.id),
  ]);
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <SignedInPage title={advisorGreeting(firstName)} showTitle>
      <AdvisorHome notifications={notifications} profileReady={profile.corporateComplete} />
    </SignedInPage>
  );
}
