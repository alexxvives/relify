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
import { prisma } from "@/server/db";
import { FileSignature } from "lucide-react";

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
  const [room, access, contracts] = await Promise.all([
    listDataRoom(user),
    sellerAdvisorAccess(user.id, projectId),
    projectId
      ? prisma.saleContract.findMany({
          where: { status: "signed", access: { projectId } },
          select: { id: true, version: true, sellerSignedAt: true, buyerSignedAt: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);
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
      {contracts.length > 0 ? (
        <section aria-labelledby="contratos-firmados" className="mt-4 rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 id="contratos-firmados" className="text-base font-semibold text-[#1c2740]">
            Contratos firmados
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {contracts.map((contract) => (
              <li key={contract.id}>
                <a
                  href={`/acuerdos/contrato/${contract.id}?firmado=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 text-base font-medium text-[#465ab4] hover:underline"
                >
                  <FileSignature className="size-5 shrink-0" aria-hidden />
                  Contrato de compraventa firmado (versión {contract.version})
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
