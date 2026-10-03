import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export async function SignedInPage({
  title,
  showTitle = true,
  children,
}: {
  title: string;
  showTitle?: boolean;
  children: ReactNode;
}) {
  return (
    <AppShell title={title} showTitle={showTitle}>
      {children}
    </AppShell>
  );
}
