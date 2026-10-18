import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export async function PublicSite({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-full flex-col overflow-x-clip bg-public-paper font-public text-public-ink">
      <LandingHeader />
      <div className="flex-1">{children}</div>
      {footer ? <LandingFooter /> : null}
    </div>
  );
}
