import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerCompanyPanel } from "@/components/seller-company-panel";
import { SignedInPage } from "@/components/signed-in-page";
import { isSellerFocusPanel } from "@/lib/company-profile";
import { sellerCopy } from "@/lib/seller-copy";
import { getCompanyDraft } from "@/server/getCompanyDraft";
import { getSellerListing } from "@/server/publishSellerProject";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified, getSellerCif, sellerHasRegistryPrefill } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.detailsTitle,
  robots: { index: false, follow: false },
};

export default async function CompanyDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; alta?: string }>;
}) {
  const query = await searchParams;
  const focus = query.seccion && isSellerFocusPanel(query.seccion) ? query.seccion : null;
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const [draft, cif, registryFilled, listing] = await Promise.all([
    getCompanyDraft(user),
    getSellerCif(user),
    sellerHasRegistryPrefill(user),
    getSellerListing(user.id),
  ]);

  return (
    <SignedInPage title={sellerCopy.detailsTitle} showTitle={false}>
      <SellerCompanyPanel
        draft={draft}
        cif={cif}
        registryFilled={registryFilled && (draft?.legalName.trim().length ?? 0) > 0}
        focus={focus}
        promptSetup={query.alta === "1"}
        reviewPending={listing?.status === "pending"}
      />
    </SignedInPage>
  );
}
