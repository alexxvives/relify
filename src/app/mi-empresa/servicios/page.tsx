import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdvisoryPicker } from "@/components/advisory-picker";
import { SignedInPage } from "@/components/signed-in-page";
import { advisoryCopy } from "@/lib/advisory";
import { sellerCopy } from "@/lib/seller-copy";
import { listPublicAdvisors } from "@/server/listPublicAdvisors";
import { getSellerListing } from "@/server/publishSellerProject";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.servicesTitle,
  robots: { index: false, follow: false },
};

export default async function SellerServicesPage() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const [advisors, listing] = await Promise.all([listPublicAdvisors(), getSellerListing(user.id)]);

  return (
    <SignedInPage title={sellerCopy.servicesHeading}>
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisoryCopy.heading}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisoryCopy.intro}</p>
        <AdvisoryPicker layout="cards" advisors={advisors} projectSlug={listing?.slug} />
      </section>
    </SignedInPage>
  );
}
