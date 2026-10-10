import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminBilling } from "@/components/admin-billing";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { getAdminBilling } from "@/server/getAdminBilling";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.billingTitle,
  robots: { index: false, follow: false },
};

export default async function AdminBillingPage() {
  const user = await requireRole("admin");
  const billing = await getAdminBilling(user);

  if (!billing) {
    notFound();
  }

  return (
    <SignedInPage title={adminCopy.billingTitle}>
      <AdminBilling billing={billing} />
    </SignedInPage>
  );
}
