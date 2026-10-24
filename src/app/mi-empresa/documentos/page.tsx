import { Suspense } from "react";
import { DocumentsSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerDocuments } from "@/components/seller-documents";
import { SignedInPage } from "@/components/signed-in-page";
import { sellerCopy } from "@/lib/seller-copy";
import { sellerAdvisorAccess } from "@/server/advisoryEngagement";
import { listDataRoom } from "@/server/listDataRoom";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.documentsTitle,
  robots: { index: false, follow: false },
};

async function DocumentsPageContent() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const projectId = await activeSellerProjectId(user.id);
  const [room, access] = await Promise.all([listDataRoom(user), sellerAdvisorAccess(user.id, projectId)]);
  if (room.audience !== "owner") {
    redirect("/mi-empresa");
  }

  return (
    <>
      <SellerDocuments
        files={room.files}
        folders={room.folders}
        shares={room.shares}
        advisors={access.ready.map((row) => ({
          engagementId: row.engagementId,
          name: row.advisorName,
          folders: row.folders,
          fileIds: row.fileIds,
        }))}
      />
    </>
  );
}

export default function DocumentsPage() {
  return (
    <SignedInPage title={sellerCopy.documentsTitle}>
      <Suspense fallback={<DocumentsSkeleton />}>
        <DocumentsPageContent />
      </Suspense>
    </SignedInPage>
  );
}
