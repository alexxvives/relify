import type { Metadata } from "next";
import { AdvisorWork } from "@/components/advisor-work";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { listAdvisorWork } from "@/server/advisoryEngagement";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.encargosTitle,
  robots: { index: false, follow: false },
};

export default async function AdvisorEngagementsPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireRole("advisor");
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    await fulfillCheckout(query.session_id, user.id);
  }

  const work = await listAdvisorWork(user.id);

  return (
    <SignedInPage title={advisorCopy.encargosTitle}>
      <AdvisorWork mine={work.mine} />
    </SignedInPage>
  );
}
