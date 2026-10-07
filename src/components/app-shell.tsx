import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { destinationsForRole } from "@/lib/shell";
import { getCurrentUser } from "@/server/getCurrentUser";
import { listNotifications } from "@/server/listNotifications";
import { activeSellerProjectId, listSellerCompanies } from "@/server/sellerCompany";

export async function AppShell({
  title,
  showTitle = true,
  children,
}: {
  title: string;
  showTitle?: boolean;
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const [notifications, companies, activeCompanyId] = await Promise.all([
    listNotifications(user.id),
    user.role === "seller" ? listSellerCompanies(user.id) : Promise.resolve([]),
    user.role === "seller" ? activeSellerProjectId(user.id) : Promise.resolve(null),
  ]);

  return (
    <AppFrame
      name={user.displayName}
      destinations={destinationsForRole(user.role)}
      title={title}
      showTitle={showTitle}
      notifications={notifications}
      showPremium={user.role === "investor"}
      companies={companies}
      activeCompanyId={activeCompanyId}
      canManageCompanies={user.role === "seller"}
    >
      {children}
    </AppFrame>
  );
}
