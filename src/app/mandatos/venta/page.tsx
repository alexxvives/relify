import type { Metadata } from "next";
import { AdvisorMandateBoard, type MandateDisplay } from "@/components/advisor-mandates";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { catalogCopy } from "@/lib/catalog-copy";
import { formatEur } from "@/lib/money";
import { listPendingMatches } from "@/server/listPendingMatches";
import { listSaleMandates, type MandateCard } from "@/server/listSaleMandates";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.mandatesTitle,
  robots: { index: false, follow: false },
};

function toMandateDisplay(project: MandateCard): MandateDisplay {
  return {
    slug: project.slug,
    codename: project.codename,
    region: project.region,
    status: project.status,
    feeRecorded: project.feeRecorded,
    owned: project.owned,
    figures: catalogCopy.metrics.map((metric) => ({
      label: metric.label,
      value: formatEur(project[metric.key]),
    })),
  };
}

export default async function AdvisorMandatesPage() {
  const user = await requireRole("advisor");
  const [mandates, pending] = await Promise.all([listSaleMandates(user.id), listPendingMatches(user.id)]);

  return (
    <SignedInPage title={advisorCopy.mandatesTitle}>
      <section className="rounded-2xl border border-[#e7eaee] bg-white px-5 py-8">
        <AdvisorMandateBoard mandates={mandates.map(toMandateDisplay)} pending={pending} />
      </section>
    </SignedInPage>
  );
}
