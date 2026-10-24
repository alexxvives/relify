import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export async function SignedInPage({
  title,
  showTitle = true,
  greeting = false,
  children,
}: {
  title: string;
  showTitle?: boolean;
  greeting?: boolean;
  children: ReactNode;
}) {
  return (
    <AppShell title={title} showTitle={showTitle} greeting={greeting}>
      {children}
    </AppShell>
  );
}
