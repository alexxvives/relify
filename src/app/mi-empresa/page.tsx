import type { Metadata } from "next";
import { CompanyNifForm } from "@/components/company-nif-form";
import { SellerOverview } from "@/components/seller-overview";
import { SignedInPage } from "@/components/signed-in-page";
import { companyCopy } from "@/lib/company-copy";
import { homePendingActions } from "@/lib/deal-pipeline";
import { sellerCopy, sellerGreeting } from "@/lib/seller-copy";
import { prisma } from "@/server/db";
import { getSellerOverview } from "@/server/getSellerOverview";
import { listNotifications } from "@/server/listNotifications";
import { listProjectMessages } from "@/server/listProjectMessages";
import { getSellerListing } from "@/server/publishSellerProject";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { requireRole } from "@/server/requireRole";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireRole("seller");
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    await fulfillCheckout(query.session_id, user.id);
  }

  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    return (
      <SignedInPage title={companyCopy.nifTitle}>
        <CompanyNifForm />
      </SignedInPage>
    );
  }

  const projectId = await activeSellerProjectId(user.id);
  const projectScope = projectId ? { id: projectId, ownerId: user.id } : { id: "" };
  const [listing, interests, questions, meetings, notifications, overview, messages] = await Promise.all([
    getSellerListing(user.id),
    prisma.projectAccess.count({ where: { project: projectScope } }),
    prisma.projectMessage.count({ where: { project: projectScope, author: "investor", kind: "question" } }),
    prisma.projectMessage.count({ where: { project: projectScope, kind: "meeting" } }),
    listNotifications(user.id),
    getSellerOverview(user.id),
    listProjectMessages(user, null),
  ]);

  return (
    <SignedInPage title={sellerGreeting(user.displayName)}>
      <SellerOverview
        listing={listing?.status ?? "missing"}
        payToPublish={listing?.requiresPayment ?? false}
        interests={interests}
        questions={questions}
        meetings={meetings}
        notifications={notifications}
        panels={overview.panels}
        series={overview.series}
        mixes={overview.mixes}
        costYears={overview.costYears}
        pending={homePendingActions(
          "seller",
          messages.threads.map((thread) => ({
            id: thread.accessId,
            who: thread.codename.length > 0 ? `${thread.label} · ${thread.codename}` : thread.label,
            href: "/mi-empresa/procesos",
            steps: thread.steps,
          })),
        )}
      />
    </SignedInPage>
  );
}
