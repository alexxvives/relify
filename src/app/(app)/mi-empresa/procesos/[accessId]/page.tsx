import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CompanyBanner } from "@/components/seller/company-banner";
import { CompanyReport } from "@/components/seller/company-report";
import { FloatingInvestorCard } from "@/components/investor/floating-investor-card";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { requireRole } from "@/lib/server/require-role";
import { getSellerBuyerFicha } from "@/lib/server/seller-buyer-ficha";

export const metadata: Metadata = {
  title: "Ficha del proceso",
  robots: { index: false, follow: false },
};

export default async function SellerProcessFichaPage({ params }: { params: Promise<{ accessId: string }> }) {
  const user = await requireRole("seller");
  const { accessId } = await params;
  const ficha = await getSellerBuyerFicha(user, accessId);

  if (!ficha) {
    redirect("/mi-empresa/procesos");
  }

  return (
    <SignedInPage title={ficha.company.codename} showTitle={false}>
      <div className="flex flex-col gap-6">
        <Link href="/mi-empresa/procesos" className="w-fit text-sm font-medium text-[#465ab4]">
          ← Volver a Mis procesos
        </Link>
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-6">
          <div className="flex min-w-0 flex-col gap-6">
            <CompanyBanner title={ficha.company.codename} subtitle={ficha.company.region} />
            <CompanyReport project={ficha.company} role="buyer" figuresOpen />
          </div>
          <aside className="mt-6 xl:sticky xl:top-6 xl:mt-0">
            <FloatingInvestorCard name={ficha.buyerLabel} profile={ficha.buyerCard} />
          </aside>
        </div>
      </div>
    </SignedInPage>
  );
}
