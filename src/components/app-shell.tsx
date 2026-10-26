import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { PlatformTermsDialog } from "@/components/platform-terms-dialog";
import { SignerProvider } from "@/components/signer-context";
import { destinationsForRole, purchaseDoneDestination, saleClosedDestination } from "@/lib/shell";
import { hasCompletedPurchase, projectSold } from "@/server/saleOutcome";
import { getCurrentUser } from "@/server/getCurrentUser";
import { listNotifications } from "@/server/listNotifications";
import { adminNewCounts } from "@/server/adminSeen";
import { menuEncargoCount, menuProcessCount } from "@/server/menuProcessCount";
import { activeSellerProjectId, listSellerCompanies } from "@/server/sellerCompany";

export async function AppShell({
  title,
  showTitle = true,
  greeting = false,
  children,
}: {
  title: string;
  showTitle?: boolean;
  /** Replace the title with a "Hola, {nombre}" heading (role homes). */
  greeting?: boolean;
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const [notifications, companies, activeCompanyId, processCount, purchased, sold, encargoCount, adminCounts] = await Promise.all([
    listNotifications(user.id),
    user.role === "seller" ? listSellerCompanies(user.id) : Promise.resolve([]),
    user.role === "seller" ? activeSellerProjectId(user.id) : Promise.resolve(null),
    menuProcessCount(user),
    user.role === "investor" ? hasCompletedPurchase(user.id) : Promise.resolve(false),
    user.role === "seller"
      ? activeSellerProjectId(user.id).then((id) => (id ? projectSold(id) : false))
      : Promise.resolve(false),
    menuEncargoCount(user),
    user.role === "admin" ? adminNewCounts(user.id) : Promise.resolve({} as Record<string, number>),
  ]);

  const destinations = destinationsForRole(user.role);
  if (user.role === "seller" && sold) {
    destinations.push(saleClosedDestination);
  }
  if (user.role === "investor" && purchased) {
    destinations.push(purchaseDoneDestination);
  }

  return (
    <SignerProvider nationalIdMissing={user.nationalIdMissing}>
    <AppFrame
      name={user.displayName}
      destinations={destinations}
      title={greeting ? `Hola, ${user.displayName.split(" ")[0] ?? user.displayName}` : title}
      showTitle={greeting || showTitle}
      notifications={notifications}
      showPremium={user.role === "investor"}
      companies={companies}
      activeCompanyId={activeCompanyId}
      canManageCompanies={user.role === "seller"}
      showHelp={user.role !== "admin"}
      processCount={processCount}
      encargoCount={encargoCount}
      navCounts={adminCounts}
    >
      {children}
      {user.termsAccepted || user.role === "admin" ? null : <PlatformTermsDialog />}
    </AppFrame>
    </SignerProvider>
  );
}
