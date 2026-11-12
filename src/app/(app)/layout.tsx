import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";

// Alex (t51): one persistent frame for every signed-in section; loading.tsx files below
// only stand in for the content area, so the sidebar never blinks or shows a skeleton.
export default function SignedInLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
