import { submitForReviewIfReady } from "@/server/submitForReview";
import { Suspense } from "react";
import { materializePendingCompanies } from "@/server/sellerCompany";
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
import { getSellerDashboard } from "@/server/getSellerDashboard";
import { withoutOwnCompany } from "@/lib/notifications";
import { listNotifications } from "@/server/listNotifications";
import { listProjectMessages } from "@/server/listProjectMessages";
import { getSellerListing } from "@/server/publishSellerProject";
import { fulfillCheckout } from "@/server/fulfillCheckout";
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

  // A CIF verified before verify created the company: turn it into the draft now.
  await materializePendingCompanies(user.id);

  // t75: a complete seller checklist (free or paid listing) moves to review on its own.
  const activeId = await activeSellerProjectId(user.id);
  if (activeId) {
    await submitForReviewIfReady(user.id, activeId);
  }

  // One round trip per wave instead of eleven sequential queries.
  const [nifVerified, projectId, listing, notifications, overview, messages, dashboard] = await Promise.all([
    companyNifIsVerified(user),
    activeSellerProjectId(user.id),
    getSellerListing(user.id),
    listNotifications(user.id),
    getSellerOverview(user.id),
    listProjectMessages(user, null),
    getSellerDashboard(user.id),
  ]);
  const [funnel, sold, own] = await Promise.all([
    sellerFunnel(user.id, projectId),
    projectId ? projectSold(projectId) : Promise.resolve(false),
    projectId ? prisma.project.findUnique({ where: { id: projectId }, select: { codename: true, sabiImportedAt: true } }) : Promise.resolve(null),
  ]);

  return (
    <>
      {/* The NIF step waits for the Relify agreement (PlatformTermsDialog in the shell); accepting it redirects back here. */}
      {user.termsAccepted ? <CompanyNifDialog active={!nifVerified} /> : null}
      <SellerOverview
        sold={sold}
        financialsPending={nifVerified && !own?.sabiImportedAt}
        listing={listing?.status ?? "missing"}
        payToPublish={listing?.requiresPayment ?? false}
        hasPhoto={Boolean((listing && projectImageSrc(listing.slug)) || (projectId && projectCoverIsStored(projectId)))}
        funnel={funnel}
        notifications={withoutOwnCompany(notifications, own?.codename)}
        checklist={overview.checklist}
        payBlocked={overview.payBlocked}
        dashboard={dashboard}
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
