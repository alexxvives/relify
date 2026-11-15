import { Suspense } from "react";
import { CompanyDetailsSkeleton, FichaPublicaSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerCompanyPanel } from "@/components/seller/seller-company-panel";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { isSellerFocusPanel } from "@/lib/company-profile";
import { sellerCopy } from "@/lib/seller-copy";
import { getCompanyDraft } from "@/lib/server/get-company-draft";
import { getSabiDetail } from "@/lib/server/sabi-detail";
import { getSabiRegistry } from "@/lib/server/sabi-registry";
import { getSellerFichaExtras } from "@/lib/server/seller-ficha-extras";
import { cardCover, mergeLegacyCover } from "@/lib/server/project-card-cover";
import { fulfillCheckout } from "@/lib/server/fulfill-checkout";
import { getSellerListing } from "@/lib/server/publish-seller-project";
import { requireRole } from "@/lib/server/require-role";
import { activeSellerProjectId } from "@/lib/server/seller-company";
import { companyNifIsVerified, getSellerCif } from "@/lib/server/verify-company-nif";

export const metadata: Metadata = {
  title: sellerCopy.detailsTitle,
  robots: { index: false, follow: false },
};

async function CompanyDetailsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; session_id?: string; tab?: string }>;
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

  const [draft, cif, listing, projectId] = await Promise.all([
    getCompanyDraft(user),
    getSellerCif(user),
    getSellerListing(user.id),
    activeSellerProjectId(user.id),
  ]);
  // t86: the old single file cover joins the project photos (first position) so the one uploader shows it.
  if (projectId) await mergeLegacyCover(projectId);
  const [sabiDetail, sabiRegistry, fichaExtras] = projectId
    ? await Promise.all([getSabiDetail(projectId), getSabiRegistry(projectId), getSellerFichaExtras(projectId)])
    : [null, null, null];
  const coverSrc = listing && projectId ? await cardCover({ id: projectId, slug: listing.slug }) : null;

  return (
    <>
      <SellerCompanyPanel
        draft={draft}
        cif={cif}
        focus={focus}
        initialTab={!focus && query.tab === "ficha" ? "deal" : "company"}
        coverSrc={coverSrc}
        sabiDetail={sabiDetail}
        sabiRegistry={sabiRegistry}
        fichaExtras={fichaExtras}
      />
    </>
  );
}

export default async function CompanyDetailsPage(props: Parameters<typeof CompanyDetailsPageContent>[0]) {
  // t91: the skeleton matches the tab in the URL, so a refresh on Ficha pública never flashes Información empresa.
  const query = await props.searchParams;
  const ficha = !query.seccion && query.tab === "ficha";
  return (
    <SignedInPage title={sellerCopy.detailsTitle} showTitle={false}>
      <Suspense fallback={ficha ? <FichaPublicaSkeleton /> : <CompanyDetailsSkeleton />}>
        <CompanyDetailsPageContent {...props} />
      </Suspense>
    </SignedInPage>
  );
}
