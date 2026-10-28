import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProcessesSkeleton } from "@/components/page-skeletons";
import { SellerSaleCompleted } from "@/components/sale-completed";
import { SignedInPage } from "@/components/signed-in-page";
import { requireRole } from "@/server/requireRole";
import { sellerSaleSummary } from "@/server/saleOutcome";
import { activeSellerProjectId } from "@/server/sellerCompany";

export const metadata: Metadata = {
  title: "Venta cerrada",
  robots: { index: false, follow: false },
};

async function SaleContent() {
  const user = await requireRole("seller");
  const sale = await sellerSaleSummary(user.id, await activeSellerProjectId(user.id));
  if (!sale) {
    redirect("/mi-empresa");
  }
  return <SellerSaleCompleted codename={sale.codename} figures={sale} docs={sale} stats={sale} />;
}

export default function SalePage() {
  return (
    <SignedInPage title="Venta cerrada">
      <Suspense fallback={<ProcessesSkeleton />}>
        <SaleContent />
      </Suspense>
    </SignedInPage>
  );
}
