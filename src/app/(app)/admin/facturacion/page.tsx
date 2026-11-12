import { Suspense } from "react";
import { AdminBillingSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminBilling } from "@/components/admin/admin-billing";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { getAdminBilling } from "@/lib/server/get-admin-billing";
import { requireRole } from "@/lib/server/require-role";

export const metadata: Metadata = {
  title: adminCopy.billingTitle,
  robots: { index: false, follow: false },
};

async function AdminBillingPageContent() {
  const user = await requireRole("admin");
  const billing = await getAdminBilling(user);

  if (!billing) {
    notFound();
  }

  return (
    <>
      <AdminBilling billing={billing} />
    </>
  );
}

export default function AdminBillingPage() {
  return (
    <SignedInPage title={adminCopy.billingTitle}>
      <Suspense fallback={<AdminBillingSkeleton />}>
        <AdminBillingPageContent />
      </Suspense>
    </SignedInPage>
  );
}
