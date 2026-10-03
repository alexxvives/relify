import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { authCopy } from "@/lib/auth-copy";
import { destinationsForRole } from "@/lib/shell";
import { getCurrentUser } from "@/server/getCurrentUser";
import { listNotifications } from "@/server/listNotifications";

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

  const roleLabel = user.role ? authCopy.roles[user.role] : authCopy.roleMissing;
  const notifications = await listNotifications(user.id);

  return (
    <AppFrame
      name={user.displayName}
      roleLabel={roleLabel}
      destinations={destinationsForRole(user.role)}
      title={title}
      showTitle={showTitle}
      notifications={notifications}
    >
      {children}
    </AppFrame>
  );
}
