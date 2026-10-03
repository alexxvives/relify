import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerProcesses } from "@/components/seller-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { sellerCopy } from "@/lib/seller-copy";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.processesTitle,
  robots: { index: false, follow: false },
};

export default async function ProcessesPage() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  return (
    <SignedInPage title={sellerCopy.processesTitle}>
      <SellerProcesses />
    </SignedInPage>
  );
}
