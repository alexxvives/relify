import { Suspense } from "react";
import { SellerHomeSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { CompanyNifDialog } from "@/components/company-nif-form";
import { SellerOverview } from "@/components/seller-overview";
import { SignedInPage } from "@/components/signed-in-page";
import { projectImageSrc } from "@/lib/project-image";
import { homePendingActions } from "@/lib/deal-pipeline";
import { sellerCopy } from "@/lib/seller-copy";
import { prisma } from "@/server/db";
import { getSellerOverview } from "@/server/getSellerOverview";
import { listNotifications } from "@/server/listNotifications";
import { listProjectMessages } from "@/server/listProjectMessages";
import { getSellerListing } from "@/server/publishSellerProject";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { CancelledProcesses } from "@/components/cancelled-processes";
import { listCancelledProcesses } from "@/server/listCancelledProcesses";
import { requireRole } from "@/server/requireRole";
import { projectCoverIsStored } from "@/server/projectCover";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.homeTitle,
  robots: { index: false, follow: false },
};

async function CompanyPageContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireRole("seller");
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    await fulfillCheckout(query.session_id, user.id);
  }

  // One round trip per wave instead of eleven sequential queries.
  const [nifVerified, projectId, listing, notifications, overview, messages, cancelled] = await Promise.all([
    companyNifIsVerified(user),
    activeSellerProjectId(user.id),
    getSellerListing(user.id),
    listNotifications(user.id),
    getSellerOverview(user.id),
    listProjectMessages(user, null),
    listCancelledProcesses(user),
  ]);
  const projectScope = projectId ? { id: projectId, ownerId: user.id } : { id: "" };
  const [interests, questions, meetings] = await Promise.all([
    prisma.projectAccess.count({ where: { project: projectScope } }),
    prisma.projectMessage.count({ where: { project: projectScope, author: "investor", kind: "question" } }),
    prisma.projectMessage.count({ where: { project: projectScope, kind: "meeting" } }),
  ]);

  return (
    <>
      {nifVerified ? null : <CompanyNifDialog />}
      <SellerOverview
        listing={listing?.status ?? "missing"}
        payToPublish={listing?.requiresPayment ?? false}
        hasPhoto={Boolean((listing && projectImageSrc(listing.slug)) || (projectId && projectCoverIsStored(projectId)))}
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
      <CancelledProcesses items={cancelled} viewer="seller" />
    </>
  );
}

export default function CompanyPage(props: Parameters<typeof CompanyPageContent>[0]) {
  return (
    <SignedInPage title={sellerCopy.homeTitle} showTitle={false}>
      <Suspense fallback={<SellerHomeSkeleton />}>
        <CompanyPageContent {...props} />
      </Suspense>
    </SignedInPage>
  );
}
