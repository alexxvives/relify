import type { ReactNode } from "react";
import { CompanyBanner } from "@/components/seller/company-banner";
import { InvestorProjectTabs } from "@/components/investor/investor-project-tabs";
import type { SectorImageKey } from "@/lib/sector-image";
import type { ProcessTabId } from "@/lib/process-tabs";

export function CompanyFichaView({
  title,
  heading = "h1",
  sector = null,
  chips = [],
  bannerAction = null,
  progress = null,
  favorite,
  bannerExtra = null,
  afterBanner = null,
  tabs,
  tabIds,
  initialTab = "company",
}: {
  title: string;
  heading?: "h1" | "p";
  sector?: SectorImageKey | null;
  chips?: string[];
  bannerAction?: ReactNode;
  progress?: ReactNode;
  favorite: ReactNode;
  bannerExtra?: ReactNode;
  afterBanner?: ReactNode;
  tabs: Partial<Record<ProcessTabId, ReactNode>>;
  /** S43: the counterparty tabs; defaults to the original company / chat / meetings row. */
  tabIds?: readonly ProcessTabId[];
  initialTab?: ProcessTabId;
}) {
  return (
    <div data-company-ficha-view className="flex w-full min-w-0 flex-col gap-6">
      <CompanyBanner heading={heading} title={title} sector={sector} chips={chips} bannerAction={bannerAction} progress={progress}>
        {favorite}
        {bannerExtra}
      </CompanyBanner>
      {afterBanner}
      <InvestorProjectTabs ids={tabIds} initialTab={initialTab} panels={tabs} />
    </div>
  );
}

export function FichaLockedNote({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white px-6 py-12 text-center">
      <p className="mx-auto max-w-lg text-sm leading-6 text-[#5c6b78]">{text}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
