import type { Metadata } from "next";
import { CompanyNifForm } from "@/components/company-nif-form";
import { SellerOverview } from "@/components/seller-overview";
import { SignedInPage } from "@/components/signed-in-page";
import { companyCopy } from "@/lib/company-copy";
import { sellerCopy, sellerGreeting } from "@/lib/seller-copy";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function CompanyPage() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  return (
    <SignedInPage title={nifVerified ? sellerGreeting(user.displayName) : companyCopy.nifTitle}>
      {nifVerified ? <SellerOverview /> : <CompanyNifForm />}
    </SignedInPage>
  );
}
