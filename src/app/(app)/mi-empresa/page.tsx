import { submitForReviewIfReady } from "@/lib/server/submit-for-review";
import { Suspense } from "react";
import { materializePendingCompanies } from "@/lib/server/seller-company";
import { SellerHomeSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { CompanyNifDialog } from "@/components/seller/company-nif-form";
import { SellerOverview } from "@/components/seller/seller-overview";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { projectImageSrc } from "@/lib/project-image";
import { homePendingActions } from "@/lib/deal-pipeline";
import { sellerCopy } from "@/lib/seller-copy";
import { prisma } from "@/lib/db";
import { sellerFunnel } from "@/lib/server/activity-funnel";
import { projectSold } from "@/lib/server/sale-outcome";
import { getSellerOverview } from "@/lib/server/get-seller-overview";
import { getSellerDashboard } from "@/lib/server/get-seller-dashboard";
import { withoutOwnCompany } from "@/lib/notifications";
import { listNotifications } from "@/lib/server/list-notifications";
import { listProjectMessages } from "@/lib/server/list-project-messages";
import { getSellerListing } from "@/lib/server/publish-seller-project";
import { fulfillCheckout } from "@/lib/server/fulfill-checkout";
import { requireRole } from "@/lib/server/require-role";
import { cardCover } from "@/lib/server/project-card-cover";
import { activeSellerProjectId } from "@/lib/server/seller-company";
import { companyNifIsVerified } from "@/lib/server/verify-company-nif";

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
  const coverSrc = listing && projectId ? await cardCover({ id: projectId, slug: listing.slug }) : null;
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
        hasPhoto={Boolean((listing && projectImageSrc(listing.slug)) || coverSrc)}
        funnel={funnel}
        notifications={withoutOwnCompany(notifications, own?.codename)}
        checklist={overview.checklist}
        recommended={overview.recommended}
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
