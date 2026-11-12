import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerTrends } from "@/components/seller/seller-trends";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { homeForRole } from "@/lib/auth-input";
import { sellerCopy } from "@/lib/seller-copy";
import { getCurrentUser } from "@/lib/server/get-current-user";

export const metadata: Metadata = {
  title: sellerCopy.trendsTitle,
  robots: { index: false, follow: false },
};

export default async function TrendsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  if (user.role !== "seller" && user.role !== "investor" && user.role !== "advisor") {
    redirect(homeForRole(user.role));
  }

  return (
    <SignedInPage title={sellerCopy.trendsTitle}>
      <SellerTrends />
    </SignedInPage>
  );
}
