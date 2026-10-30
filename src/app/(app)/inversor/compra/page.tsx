import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SaleSkeleton } from "@/components/page-skeletons";
import { BuyerPurchaseCompleted } from "@/components/sale-completed";
import { SignedInPage } from "@/components/signed-in-page";
import { requireRole } from "@/server/requireRole";
import { buyerPurchaseSummary } from "@/server/saleOutcome";

export const metadata: Metadata = {
  title: "Empresa comprada",
  robots: { index: false, follow: false },
};

async function PurchaseContent() {
  const user = await requireRole("investor");
  const purchase = await buyerPurchaseSummary(user.id);
  if (!purchase) {
    redirect("/procesos");
  }
  return <BuyerPurchaseCompleted purchase={purchase} />;
}

export default function PurchasePage() {
  return (
    <SignedInPage title="Empresa comprada">
      <Suspense fallback={<SaleSkeleton />}>
        <PurchaseContent />
      </Suspense>
    </SignedInPage>
  );
}
