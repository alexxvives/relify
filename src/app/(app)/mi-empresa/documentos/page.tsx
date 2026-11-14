import { Suspense } from "react";
import { DocumentsSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerDocuments } from "@/components/seller/seller-documents";
import { SellerPdfCard } from "@/components/seller/company-pdf-card";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { sellerCopy } from "@/lib/seller-copy";
import { sellerAdvisorAccess } from "@/lib/server/advisory-engagement";
import { sellerTeaserDesk } from "@/lib/server/company-pdfs";
import { listDataRoom } from "@/lib/server/list-data-room";
import { activeSellerProjectId } from "@/lib/server/seller-company";
import { requireRole } from "@/lib/server/require-role";
import { companyNifIsVerified } from "@/lib/server/verify-company-nif";

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
  const [room, access, teaserDesk] = await Promise.all([
    listDataRoom(user),
    sellerAdvisorAccess(user.id, projectId),
    sellerTeaserDesk(user.id),
  ]);
  if (room.audience !== "owner") {
    redirect("/mi-empresa");
  }

  const teaser = teaserDesk ? (
    <SellerPdfCard
      desk={teaserDesk}
      previewHref="/mi-empresa/pdf/teaser?preview=1"
      downloadHref="/mi-empresa/pdf/teaser?download=1"
    />
  ) : null;

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
        teaser={teaser}
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
