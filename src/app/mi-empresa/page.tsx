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
import { sellerFunnel } from "@/server/activityFunnel";
import { projectSold } from "@/server/saleOutcome";
import { getSellerOverview } from "@/server/getSellerOverview";
import { withoutOwnCompany } from "@/lib/notifications";
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
  const [funnel, sold, own] = await Promise.all([
    sellerFunnel(user.id, projectId),
    projectId ? projectSold(projectId) : Promise.resolve(false),
    projectId ? prisma.project.findUnique({ where: { id: projectId }, select: { codename: true } }) : Promise.resolve(null),
  ]);

  return (
    <>
      {nifVerified ? null : <CompanyNifDialog />}
      <SellerOverview
        sold={sold}
        listing={listing?.status ?? "missing"}
        payToPublish={listing?.requiresPayment ?? false}
        hasPhoto={Boolean((listing && projectImageSrc(listing.slug)) || (projectId && projectCoverIsStored(projectId)))}
        funnel={funnel}
        notifications={withoutOwnCompany(notifications, own?.codename)}
        panels={overview.panels}
        series={overview.series}
        mixes={overview.mixes}
        costYears={overview.costYears}
        pending={homePendingActions(
          "seller",
          messages.threads.map((thread) => ({
            id: thread.accessId,
            who: thread.label,
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
