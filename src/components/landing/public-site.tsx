import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export async function PublicSite({ children, footer = true, dockedCta = false }: { children: ReactNode; footer?: boolean; dockedCta?: boolean }) {
  return (
    <div
      className={`flex min-h-full flex-col overflow-x-clip bg-public-paper font-public text-public-ink ${dockedCta ? "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0" : ""}`}
    >
      <LandingHeader />
      <div className="flex-1">{children}</div>
      {footer ? <LandingFooter /> : null}
    </div>
  );
}
