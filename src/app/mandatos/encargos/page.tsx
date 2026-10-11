import type { Metadata } from "next";
import { AdvisorProcesses } from "@/components/advisor-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { listAdvisorProjectBoards } from "@/server/advisoryEngagement";
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

  const boards = await listAdvisorProjectBoards(user.id, "awaiting");

  return (
    <SignedInPage title={advisorCopy.encargosTitle}>
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#1c2740]">{engagementCopy.mineTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-[#64748b]">{engagementCopy.mineIntro}</p>
        </div>
        <AdvisorProcesses boards={boards} empty={engagementCopy.mineEmpty} />
      </section>
    </SignedInPage>
  );
}
