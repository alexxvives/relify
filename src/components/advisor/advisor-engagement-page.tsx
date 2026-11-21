import { redirect } from "next/navigation";
import { AdvisorEngagementView } from "@/components/advisor/advisor-engagement-view";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { advisorEngagementHref } from "@/lib/advisor-processes";
import { engagementCopy } from "@/lib/engagement-copy";
import { madridToday } from "@/lib/meeting";
import { getAdvisorEngagement } from "@/lib/server/advisory-engagement";
import { getEngagementThread } from "@/lib/server/engagement-thread";
import { listAdvisorProcessChats } from "@/lib/server/advisor-process-chat";
import { fulfillCheckout } from "@/lib/server/fulfill-checkout";
import { requireRole } from "@/lib/server/require-role";

export type AdvisorEngagementSearch = { session_id?: string; deposito?: string; suscripcion?: string };

/**
 * S37 (Alex): an encargo lives under Encargos until its deposit is paid, then under Mis procesos
 * (/mandatos/venta/[id]), so the side menu highlights the right section. Each route redirects to the other when
 * the encargo belongs there, keeping old links working.
 */
export async function AdvisorEngagementPage({
  id,
  query,
  section,
}: {
  id: string;
  query: AdvisorEngagementSearch;
  section: "encargos" | "venta";
}) {
  const user = await requireRole("advisor");

  if (typeof query.session_id === "string" && query.session_id !== "") {
    const applied = await fulfillCheckout(query.session_id, user.id);
    redirect(
      applied.ok
        ? applied.kind === "advisor_inbox"
          ? `/mandatos/encargos/${id}?suscripcion=1`
          : `/mandatos/venta/${id}?deposito=1`
        : `/mandatos/encargos/${id}?deposito=0`,
    );
  }

  const engagement = await getAdvisorEngagement(user, id);

  if (!engagement) {
    // Old "Avisos" links can point at an encargo that was declined, withdrawn
    // or reassigned. Land on the encargos list instead of a 404.
    redirect("/mandatos/encargos");
  }

  const paid = engagement.deposit.paid || engagement.closed;
  if ((section === "venta") !== paid) {
    const search = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    const qs = search.toString();
    redirect(`${advisorEngagementHref(id, paid)}${qs ? `?${qs}` : ""}`);
  }

  const [thread, processChats] = paid
    ? await Promise.all([getEngagementThread(user, id), listAdvisorProcessChats(user, id)])
    : [null, null];
  const notice = query.deposito === "1" ? engagementCopy.depositPaidNote : query.deposito === "0" ? engagementCopy.depositFailed : null;

  return (
    <SignedInPage title={engagement.codename} showTitle={false}>
      <AdvisorEngagementView engagement={engagement} thread={thread} processChats={processChats} today={madridToday(new Date())} notice={notice} />
    </SignedInPage>
  );
}
