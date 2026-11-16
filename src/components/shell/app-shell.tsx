import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/shell/app-frame";
import { PlatformTermsDialog } from "@/components/auth/platform-terms-dialog";
import { SignerProvider } from "@/components/investor/signer-context";
import { isIntEnvironment } from "@/lib/int-env";
import { destinationsForRole, purchaseDoneDestination, saleClosedDestination } from "@/lib/shell";
import { hasCompletedPurchase, projectSold } from "@/lib/server/sale-outcome";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { listNotifications } from "@/lib/server/list-notifications";
import { adminNavCounts, type AdminNavCount } from "@/lib/server/admin-seen";
import { menuEncargoCount, menuProcessCount } from "@/lib/server/menu-process-count";
import { activeSellerProjectId, listSellerCompanies } from "@/lib/server/seller-company";
import { loadInvestorDesk } from "@/lib/server/investor-desk";
import { homePendingActions } from "@/lib/deal-pipeline";
import { agreementNeedsNationalId, onboardingNationalIdPath } from "@/lib/identity-declaration";

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

  if (agreementNeedsNationalId(user)) {
    redirect(onboardingNationalIdPath);
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
    <SignerProvider nationalIdMissing={user.nationalIdMissing} nationalIdMasked={user.nationalIdMasked}>
    <AppFrame
      name={user.displayName}
      destinations={destinations}
      notifications={notifications}
      showPremium={user.role === "investor"}
      companies={companies}
      activeCompanyId={activeCompanyId}
      canManageCompanies={user.role === "seller"}
      showHelp={user.role !== "admin"}
      showInt={isIntEnvironment()}
      processCount={processCount}
      processPending={buyerPending}
      encargoCount={encargoCount}
      navCounts={adminCounts}
    >
      {children}
      <PlatformTermsDialog required={!user.termsAccepted && user.role !== "admin"} />
    </AppFrame>
    </SignerProvider>
  );
}
