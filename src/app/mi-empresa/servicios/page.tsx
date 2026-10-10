import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdvisoryPicker } from "@/components/advisory-picker";
import { SignedInPage } from "@/components/signed-in-page";
import { selectedEngagementCompany } from "@/lib/advisor-directory";
import { advisoryCopy } from "@/lib/advisory";
import { madridToday } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import { listClientContacts } from "@/server/engagementThread";
import { listPublicAdvisors } from "@/server/listPublicAdvisors";
import { requireRole } from "@/server/requireRole";
import { listSellerAdvisoryCompanies } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.servicesTitle,
  robots: { index: false, follow: false },
};

export default async function SellerServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const query = await searchParams;
  const [advisors, companies, contacts] = await Promise.all([
    listPublicAdvisors(),
    listSellerAdvisoryCompanies(user.id),
    listClientContacts(user),
  ]);

  return (
    <SignedInPage title={sellerCopy.servicesHeading}>
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisoryCopy.heading}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisoryCopy.intro}</p>
        <AdvisoryPicker
          key={selectedEngagementCompany(companies, query.empresa) || "empresa"}
          layout="cards"
          advisors={advisors}
          companies={companies}
          initialCompany={selectedEngagementCompany(companies, query.empresa)}
          contacts={contacts}
          today={madridToday(new Date())}
        />
      </section>
    </SignedInPage>
  );
}
