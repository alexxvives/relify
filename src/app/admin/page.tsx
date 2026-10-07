import type { Metadata } from "next";
import { AdminHome } from "@/components/admin-home";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { getAdminOverview } from "@/server/getAdminOverview";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireRole("admin");
  const overview = await getAdminOverview();

  return (
    <SignedInPage title={adminCopy.homeTitle}>
      <AdminHome overview={overview} />
    </SignedInPage>
  );
}
