import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerDocuments } from "@/components/seller-documents";
import { SignedInPage } from "@/components/signed-in-page";
import { sellerCopy } from "@/lib/seller-copy";
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

  return (
    <SignedInPage title={sellerCopy.documentsTitle}>
      <SellerDocuments />
    </SignedInPage>
  );
}
