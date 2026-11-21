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
import { requireRole } from "@/lib/server/require-role";
import { getSellerBuyerFicha } from "@/lib/server/seller-buyer-ficha";

export const metadata: Metadata = {
  title: "Ficha del proceso",
  robots: { index: false, follow: false },
};

const tabIds = ["company", "questions", "meetings"] as const;

/**
 * S40 (Alex): the seller's process ficha matches the buyer's: tabs for the company, Chat / Documentos and Reuniones,
 * a buyer filter when several buyers are in process (S41: swapped in place), and the buyer card as the advisor's overlay.
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

  const slug = messages.threads.find((row) => row.accessId === accessId)?.slug ?? null;
  const threads = messages.threads.filter((row) => row.slug === slug);
  const openIds = new Set(threads.filter((row) => row.stage === "open").map((row) => row.accessId));
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
          threads={threads}
          initialAccessId={accessId}
          buyers={ficha.buyers.map((row) => ({ ...row, open: openIds.has(row.accessId) }))}
          today={madridToday(new Date())}
          initialTab={initialTab}
        />
      </div>
    </SignedInPage>
  );
}
