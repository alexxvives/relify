import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminAdvisors } from "@/components/admin-advisors";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { listAdminAdvisors } from "@/server/listAdminAdvisors";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.advisorsTitle,
  robots: { index: false, follow: false },
};

export default async function AdminAdvisorsPage() {
  const user = await requireRole("admin");
  const advisors = await listAdminAdvisors(user);

  if (!advisors) {
    notFound();
  }

  return (
    <SignedInPage title={adminCopy.advisorsTitle} showTitle={false}>
      <AdminAdvisors advisors={advisors} />
    </SignedInPage>
  );
}
