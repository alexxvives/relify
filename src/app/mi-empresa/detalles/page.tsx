import { Suspense } from "react";
import { CompanyDetailsSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerCompanyPanel } from "@/components/seller-company-panel";
import { SignedInPage } from "@/components/signed-in-page";
import { isSellerFocusPanel } from "@/lib/company-profile";
import { sellerCopy } from "@/lib/seller-copy";
import { getCompanyDraft } from "@/server/getCompanyDraft";
import { projectCoverHref, projectCoverIsStored, projectCoverVersion } from "@/server/projectCover";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { getSellerListing } from "@/server/publishSellerProject";
import { requireRole } from "@/server/requireRole";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { companyNifIsVerified, getSellerCif, sellerHasRegistryPrefill } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.detailsTitle,
  robots: { index: false, follow: false },
};

async function CompanyDetailsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; alta?: string; session_id?: string }>;
}) {
  const query = await searchParams;
  const focus = query.seccion && isSellerFocusPanel(query.seccion) ? query.seccion : null;
  const user = await requireRole("seller");

  if (typeof query.session_id === "string" && query.session_id !== "") {
    await fulfillCheckout(query.session_id, user.id);
  }

  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const [draft, cif, registryFilled, listing, projectId] = await Promise.all([
    getCompanyDraft(user),
    getSellerCif(user),
    sellerHasRegistryPrefill(user),
    getSellerListing(user.id),
    activeSellerProjectId(user.id),
  ]);
  const coverVersion = projectId && projectCoverIsStored(projectId) ? projectCoverVersion(projectId) : null;
  const coverSrc = listing && coverVersion ? projectCoverHref(listing.slug, coverVersion) : null;

  return (
    <>
      <SellerCompanyPanel
        draft={draft}
        cif={cif}
        registryFilled={registryFilled && (draft?.legalName.trim().length ?? 0) > 0}
        focus={focus}
        promptSetup={query.alta === "1"}
        reviewPending={listing?.status === "pending"}
        coverSrc={coverSrc}
      />
    </>
  );
}

export default function CompanyDetailsPage(props: Parameters<typeof CompanyDetailsPageContent>[0]) {
  return (
    <SignedInPage title={sellerCopy.detailsTitle} showTitle={false}>
      <Suspense fallback={<CompanyDetailsSkeleton />}>
        <CompanyDetailsPageContent {...props} />
      </Suspense>
    </SignedInPage>
  );
}
