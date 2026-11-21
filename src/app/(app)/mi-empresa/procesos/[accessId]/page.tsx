import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BuyerCardOverlay } from "@/components/advisor/advisor-rail-dock";
import { BuyerCardSlider } from "@/components/advisor/buyer-card-slider";
import { CompanyBanner } from "@/components/seller/company-banner";
import { CompanyReport } from "@/components/seller/company-report";
import { SellerProcessDesk } from "@/components/seller/seller-process-desk";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { madridToday } from "@/lib/meeting";
import { listProjectMessages } from "@/lib/server/list-project-messages";
import { requireRole } from "@/lib/server/require-role";
import { getSellerBuyerFicha } from "@/lib/server/seller-buyer-ficha";

export const metadata: Metadata = {
  title: "Ficha del proceso",
  robots: { index: false, follow: false },
};

const tabIds = ["company", "questions", "meetings"] as const;

/**
 * S40 (Alex): the seller's process ficha matches the buyer's: tabs for the company, Chat / Documentos and Reuniones,
 * a buyer filter when several buyers are in process, and the buyer card as the same minimisable overlay the advisor has.
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
  const [ficha, messages] = await Promise.all([getSellerBuyerFicha(user, accessId), listProjectMessages(user, null)]);

  if (!ficha) {
    redirect("/mi-empresa/procesos");
  }

  const open = messages.threads.filter((thread) => thread.stage === "open");
  const thread = messages.threads.find((row) => row.accessId === accessId) ?? null;
  const initialTab = tabIds.find((id) => id === query.pestana) ?? "company";

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
          thread={thread}
          buyers={open.map((row) => ({ value: row.accessId, label: row.label }))}
          today={madridToday(new Date())}
          initialTab={initialTab}
        />
      </div>
      <BuyerCardOverlay>
        <BuyerCardSlider buyers={[{ id: accessId, label: ficha.buyerLabel, card: ficha.buyerCard }]} />
      </BuyerCardOverlay>
    </SignedInPage>
  );
}
