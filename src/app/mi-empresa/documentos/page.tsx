import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerDocuments } from "@/components/seller-documents";
import { SignedInPage } from "@/components/signed-in-page";
import { sellerCopy } from "@/lib/seller-copy";
import { listDataRoom } from "@/server/listDataRoom";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.documentsTitle,
  robots: { index: false, follow: false },
};

export default async function DocumentsPage() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const room = await listDataRoom(user);
  if (room.audience !== "owner") {
    redirect("/mi-empresa");
  }

  return (
    <SignedInPage title={sellerCopy.documentsTitle}>
      <SellerDocuments files={room.files} folders={room.folders} shares={room.shares} />
    </SignedInPage>
  );
}
