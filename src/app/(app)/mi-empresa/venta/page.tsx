import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SaleSkeleton } from "@/components/shell/page-skeletons";
import { SellerSaleCompleted } from "@/components/seller/sale-completed";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { requireRole } from "@/lib/server/require-role";
import { sellerSaleSummary } from "@/lib/server/sale-outcome";
import { activeSellerProjectId } from "@/lib/server/seller-company";

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
      <Suspense fallback={<SaleSkeleton />}>
        <SaleContent />
      </Suspense>
    </SignedInPage>
  );
}
