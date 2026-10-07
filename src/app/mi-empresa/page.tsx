import type { Metadata } from "next";
import { CompanyNifForm } from "@/components/company-nif-form";
import { SellerOverview } from "@/components/seller-overview";
import { SignedInPage } from "@/components/signed-in-page";
import { companyCopy } from "@/lib/company-copy";
import { sellerCopy, sellerGreeting } from "@/lib/seller-copy";
import { prisma } from "@/server/db";
import { getSellerOverview } from "@/server/getSellerOverview";
import { listNotifications } from "@/server/listNotifications";
import { getSellerListing } from "@/server/publishSellerProject";
import { requireRole } from "@/server/requireRole";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function CompanyPage() {
  const user = await requireRole("seller");
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
  const [listing, interests, questions, meetings, notifications, overview] = await Promise.all([
    getSellerListing(user.id),
    prisma.projectAccess.count({ where: { project: projectScope } }),
    prisma.projectMessage.count({ where: { project: projectScope, author: "investor", kind: "question" } }),
    prisma.projectMessage.count({ where: { project: projectScope, kind: "meeting" } }),
    listNotifications(user.id),
    getSellerOverview(user.id),
  ]);

  return (
    <SignedInPage title={sellerGreeting(user.displayName)}>
      <SellerOverview
        listing={listing?.status ?? "missing"}
        interests={interests}
        questions={questions}
        meetings={meetings}
        notifications={notifications}
        panels={overview.panels}
        series={overview.series}
        mixes={overview.mixes}
        costYears={overview.costYears}
      />
    </SignedInPage>
  );
}
