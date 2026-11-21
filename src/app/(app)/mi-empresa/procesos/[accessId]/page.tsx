import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CompanyBanner } from "@/components/seller/company-banner";
import { CompanyReport } from "@/components/seller/company-report";
import { SellerProcessDesk } from "@/components/seller/seller-process-desk";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { madridToday } from "@/lib/meeting";
import { listProjectMessages } from "@/lib/server/list-project-messages";
import { listClientContacts } from "@/lib/server/engagement-thread";
import { counterpartyTabIds, readProcessTab } from "@/lib/process-tabs";
import { requireRole } from "@/lib/server/require-role";
import { getSellerBuyerFicha } from "@/lib/server/seller-buyer-ficha";

export const metadata: Metadata = {
  title: "Ficha del proceso",
  robots: { index: false, follow: false },
};

/**
 * S40 (Alex): the seller's process ficha matches the buyer's. S43: tabs Información de la empresa, Compradores (buyer
 * filter, swapped in place) and Asesor when the seller hired one for this company.
 */
export default async function SellerProcessFichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ accessId: string }>;
  searchParams: Promise<{ pestana?: string }>;
}) {
  const user = await requireRole("seller");
  const [{ accessId }, query] = await Promise.all([params, searchParams]);
  const [ficha, messages, contacts] = await Promise.all([
    getSellerBuyerFicha(user, accessId),
    listProjectMessages(user, null),
    listClientContacts(user),
  ]);

  if (!ficha) {
    redirect("/mi-empresa/procesos");
  }

  const slug = messages.threads.find((row) => row.accessId === accessId)?.slug ?? null;
  const threads = messages.threads.filter((row) => row.slug === slug);
  const openIds = new Set(threads.filter((row) => row.stage === "open").map((row) => row.accessId));
  // S43: the seller's own advisor thread for this company (server-scoped: listClientContacts only returns the seller's encargos).
  const advisors = contacts.filter((row) => row.slug === slug);
  const initialTab = readProcessTab(query.pestana, counterpartyTabIds("seller", { advisor: advisors.length > 0 }));

  return (
    <SignedInPage title={ficha.company.codename} showTitle={false}>
      <LiveRefresh />
      <div className="flex flex-col gap-6">
        <Link href="/mi-empresa/procesos" className="w-fit text-sm font-medium text-[#465ab4]">
          ← Volver a Mis procesos
        </Link>
        <CompanyBanner title={ficha.company.codename} subtitle={ficha.company.region} />
        <SellerProcessDesk
          company={<CompanyReport project={ficha.company} role="buyer" figuresOpen />}
          threads={threads}
          initialAccessId={accessId}
          buyers={ficha.buyers.map((row) => ({ ...row, open: openIds.has(row.accessId) }))}
          today={madridToday(new Date())}
          initialTab={initialTab}
          advisors={advisors}
        />
      </div>
    </SignedInPage>
  );
}
