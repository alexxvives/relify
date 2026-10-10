import type { Metadata } from "next";
import { AdvisoryPicker } from "@/components/advisory-picker";
import { SignedInPage } from "@/components/signed-in-page";
import { selectedEngagementCompany } from "@/lib/advisor-directory";
import { advisoryCopy } from "@/lib/advisory";
import { madridToday } from "@/lib/meeting";
import { listClientContacts } from "@/server/engagementThread";
import { listInvestorNdaCompanies } from "@/server/listInvestorNdaCompanies";
import { listPublicAdvisors } from "@/server/listPublicAdvisors";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisoryCopy.title,
  robots: { index: false, follow: false },
};

export default async function AdvisoryPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const user = await requireRole("investor");
  const query = await searchParams;
  const [advisors, companies, contacts] = await Promise.all([
    listPublicAdvisors(),
    listInvestorNdaCompanies(user.id),
    listClientContacts(user),
  ]);

  return (
    <SignedInPage title={advisoryCopy.title}>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-6">
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
