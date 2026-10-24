import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerProcesses } from "@/components/seller-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { madridToday } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import { listClientContacts } from "@/server/engagementThread";
import { CancelledProcesses } from "@/components/cancelled-processes";
import { listCancelledProcesses } from "@/server/listCancelledProcesses";
import { listPendingMatches } from "@/server/listPendingMatches";
import { listProjectMessages } from "@/server/listProjectMessages";
import { requireRole } from "@/server/requireRole";
import { activeSellerProjectId, sellerProcessScope } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.processesTitle,
  robots: { index: false, follow: false },
};

export default async function ProcessesPage() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const projectId = await activeSellerProjectId(user.id);
  const [messages, pendingMatches, advisors, scope, cancelled] = await Promise.all([
    listProjectMessages(user, null),
    listPendingMatches(user.id, projectId),
    listClientContacts(user),
    sellerProcessScope(user.id),
    listCancelledProcesses(user),
  ]);

  return (
    <SignedInPage title={sellerCopy.processesTitle}>
      <SellerProcesses
        threads={messages.threads}
        counts={messages.counts}
        pendingMatches={pendingMatches}
        today={madridToday(new Date())}
        advisors={advisors}
        companyName={scope.codename}
        elsewhere={scope.elsewhere}
      />
      <CancelledProcesses items={cancelled} viewer="seller" />
    </SignedInPage>
  );
}
