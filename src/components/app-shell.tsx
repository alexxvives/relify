import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { PlatformTermsDialog } from "@/components/platform-terms-dialog";
import { SignerProvider } from "@/components/signer-context";
import { destinationsForRole, purchaseDoneDestination, saleClosedDestination } from "@/lib/shell";
import { hasCompletedPurchase, projectSold } from "@/server/saleOutcome";
import { getCurrentUser } from "@/server/getCurrentUser";
import { listNotifications } from "@/server/listNotifications";
import { adminNavCounts, type AdminNavCount } from "@/server/adminSeen";
import { menuEncargoCount, menuProcessCount } from "@/server/menuProcessCount";
import { activeSellerProjectId, listSellerCompanies } from "@/server/sellerCompany";
import { loadInvestorDesk } from "@/server/investorDesk";
import { homePendingActions } from "@/lib/deal-pipeline";

/**
 * Signed-in frame (sidebar, mobile header, bottom tabs). Rendered once by the (app) route-group
 * layout so it persists across page changes; pages render their own title via SignedInPage.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const [notifications, companies, activeCompanyId, processCount, purchased, sold, encargoCount, adminCounts, buyerPending] = await Promise.all([
    listNotifications(user.id),
    user.role === "seller" ? listSellerCompanies(user.id) : Promise.resolve([]),
    user.role === "seller" ? activeSellerProjectId(user.id) : Promise.resolve(null),
    menuProcessCount(user),
    user.role === "investor" ? hasCompletedPurchase(user.id) : Promise.resolve(false),
    user.role === "seller"
      ? activeSellerProjectId(user.id).then((id) => (id ? projectSold(id) : false))
      : Promise.resolve(false),
    menuEncargoCount(user),
    user.role === "admin" ? adminNavCounts(user.id) : Promise.resolve({} as Record<string, AdminNavCount>),
    // Buyer: same "your turn" actions as the Inicio list, as a red bubble on Mis procesos.
    user.role === "investor"
      ? loadInvestorDesk(user.id, user.email).then(
          (desk) =>
            homePendingActions(
              "investor",
              desk.processes.map((process) => ({ id: process.accessId, who: process.codename, href: "/procesos", steps: process.steps })),
            ).length,
        )
      : Promise.resolve(0),
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
      notifications={notifications}
      showPremium={user.role === "investor"}
      companies={companies}
      activeCompanyId={activeCompanyId}
      canManageCompanies={user.role === "seller"}
      showHelp={user.role !== "admin"}
      processCount={processCount}
      processPending={buyerPending}
      encargoCount={encargoCount}
      navCounts={adminCounts}
    >
      {children}
      {user.termsAccepted || user.role === "admin" ? null : <PlatformTermsDialog />}
    </AppFrame>
    </SignerProvider>
  );
}
