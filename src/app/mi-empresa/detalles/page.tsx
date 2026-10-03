import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerCompanyPanel } from "@/components/seller-company-panel";
import { SignedInPage } from "@/components/signed-in-page";
import { sellerCopy } from "@/lib/seller-copy";
import { getCompanyDraft } from "@/server/getCompanyDraft";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified, getSellerCif, sellerHasRegistryPrefill } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.detailsTitle,
  robots: { index: false, follow: false },
};

export default async function CompanyDetailsPage() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const [draft, cif, registryFilled] = await Promise.all([
    getCompanyDraft(user),
    getSellerCif(user),
    sellerHasRegistryPrefill(user),
  ]);

  return (
    <SignedInPage title={sellerCopy.detailsTitle} showTitle={false}>
      <SellerCompanyPanel draft={draft} cif={cif} registryFilled={registryFilled} />
    </SignedInPage>
  );
}
