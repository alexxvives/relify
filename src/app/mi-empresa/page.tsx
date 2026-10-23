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
import { requireRole } from "@/server/requireRole";
import { projectCoverIsStored } from "@/server/projectCover";
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
  const projectId = await activeSellerProjectId(user.id);
  const projectScope = projectId ? { id: projectId, ownerId: user.id } : { id: "" };
  const listing = await getSellerListing(user.id);
  const interests = await prisma.projectAccess.count({ where: { project: projectScope } });
  const questions = await prisma.projectMessage.count({
    where: { project: projectScope, author: "investor", kind: "question" },
  });
  const meetings = await prisma.projectMessage.count({ where: { project: projectScope, kind: "meeting" } });
  const notifications = await listNotifications(user.id);
  const overview = await getSellerOverview(user.id);
  const messages = await listProjectMessages(user, null);

  return (
    <SignedInPage title={sellerCopy.homeTitle}>
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
    </SignedInPage>
  );
}
