"use client";

import { useState, type ReactNode } from "react";
import { Building2, Calendar, MessageCircle } from "lucide-react";
import { companyCopy } from "@/lib/company-copy";

const tabs = [
  { id: "company", label: companyCopy.tabs.company, icon: Building2 },
  { id: "questions", label: companyCopy.tabs.questions, icon: MessageCircle },
  { id: "meetings", label: companyCopy.tabs.meetings, icon: Calendar },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function InvestorProjectTabs({
  panels,
  initialTab = "company",
  actions = null,
  notice = null,
}: {
  panels: Record<TabId, ReactNode>;
  initialTab?: TabId;
  /** t81: buttons at the right end of the tab row (admin SABI import, notify seller). */
  actions?: ReactNode;
  /** t81: full-width block right under the tab row (SABI import progress and preview). */
  notice?: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>(initialTab);

  return (
    <>
      <div className={actions ? "flex flex-col-reverse gap-3 border-b border-[#e6e9f0] sm:flex-row sm:items-end sm:justify-between" : ""}>
      <div className="min-w-0 overflow-x-auto">
        <div role="tablist" aria-label={companyCopy.tabsLabel} className={actions ? "flex min-w-max gap-1" : "flex min-w-max gap-1 border-b border-[#e6e9f0]"}>
          {tabs.map((item) => {
            const selected = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`panel-${item.id}`}
                onClick={() => {
                  setTab(item.id);
                }}
                className={
                  selected
                    ? "inline-flex items-center gap-2 border-b-2 border-[#3d34b8] px-3 py-3 text-sm font-medium text-[#3d34b8]"
                    : "inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm text-[#5c6b78]"
                }
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 pb-2 sm:justify-end">{actions}</div> : null}
      </div>
      {notice}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {panels[tab]}
      </div>
    </>
  );
}
