import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FinancialsSkeleton, FinancialsWorkspace } from "@/components/seller-financials";
import { SignedInPage } from "@/components/signed-in-page";
import { listFilings } from "@/server/financialFilings";
import { requireRole } from "@/server/requireRole";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: "Datos financieros",
  robots: { index: false, follow: false },
};

async function FinancialsContent() {
  const user = await requireRole("seller");

  if (!(await companyNifIsVerified(user))) {
    redirect("/mi-empresa");
  }

  const data = await listFilings(user);

  if (!data) {
    redirect("/mi-empresa");
  }

  return <FinancialsWorkspace years={data.years} filings={data.filings} />;
}

export default function FinancialsPage() {
  return (
    <SignedInPage title="Datos financieros">
      <Suspense fallback={<FinancialsSkeleton />}>
        <FinancialsContent />
      </Suspense>
    </SignedInPage>
  );
}
