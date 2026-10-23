import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHome } from "@/components/admin-home";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { getAdminDashboard } from "@/server/getAdminDashboard";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.homeTitle,
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await requireRole("admin");
  const overview = await getAdminDashboard(user);

  if (!overview) {
    notFound();
  }

  return (
    <SignedInPage title={adminCopy.homeTitle} showTitle={false}>
      <AdminHome overview={overview} />
    </SignedInPage>
  );
}
