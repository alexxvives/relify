"use client";

import { useState, type ReactNode } from "react";
import { BriefcaseBusiness, Building2, Calendar, MessageCircle, Store, UserRound, Users, type LucideIcon } from "lucide-react";
import { companyCopy } from "@/lib/company-copy";
import { legacyProcessTabs, type ProcessTabId } from "@/lib/process-tabs";

export type { ProcessTabId } from "@/lib/process-tabs";

const tabIcons: Record<ProcessTabId, LucideIcon> = {
  company: Building2,
  questions: MessageCircle,
  meetings: Calendar,
  seller: Store,
  buyers: Users,
  buyer: UserRound,
  advisor: BriefcaseBusiness,
};

/**
 * The ficha tab row shared by buyer, seller, advisor and admin. S43: the tabs come from `ids` (per counterparty for
 * the process fichas; admin keeps the original three). `actions` (the buyer filter) sits vertically centred at the
 * right of the row.
 */
export function InvestorProjectTabs({
  panels,
  ids = legacyProcessTabs,
  initialTab = "company",
  actions = null,
  notice = null,
  onTabChange,
}: {
  panels: Partial<Record<ProcessTabId, ReactNode>>;
  ids?: readonly ProcessTabId[];
  initialTab?: ProcessTabId;
  /** t81: buttons at the right end of the tab row (admin SABI import, notify seller, buyer filter). */
  actions?: ReactNode;
  /** t81: full-width block right under the tab row (SABI import progress and preview). */
  notice?: ReactNode;
  /** S40: the seller marks a chat read when its tab opens. */
  onTabChange?: (tab: ProcessTabId) => void;
}) {
  const [tab, setTabState] = useState<ProcessTabId>(ids.includes(initialTab) ? initialTab : "company");
  const setTab = (next: ProcessTabId) => {
    setTabState(next);
    onTabChange?.(next);
  };

  return (
    <>
      <div className={actions ? "flex flex-col-reverse gap-3 border-b border-[#e6e9f0] sm:flex-row sm:items-center sm:justify-between" : ""}>
      <div className="min-w-0 overflow-x-auto">
        <div
          role="tablist"
          aria-label={companyCopy.tabsLabel}
          className="grid gap-1 rounded-full bg-[#f4f6fb] p-1 lg:hidden"
          style={{ gridTemplateColumns: `repeat(${ids.length}, minmax(0, 1fr))` }}
        >
          {ids.map((id) => {
            const selected = tab === id;
            return (
              <button
                key={`compact-${id}`}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={selected}
                aria-controls={`panel-${id}`}
                onClick={() => {
                  setTab(id);
                }}
                className={
                  selected
                    ? "inline-flex h-11 items-center justify-center rounded-full bg-white px-2 text-sm font-semibold text-[#1c2740] shadow-sm"
                    : "inline-flex h-11 items-center justify-center rounded-full px-2 text-sm text-[#5c6b78]"
                }
              >
                {companyCopy.tabsCompact[id]}
              </button>
            );
          })}
        </div>
        <div role="tablist" aria-label={companyCopy.tabsLabel} className={actions ? "hidden min-w-max gap-1 lg:flex" : "hidden min-w-max gap-1 border-b border-[#e6e9f0] lg:flex"}>
          {ids.map((id) => {
            const selected = tab === id;
            const Icon = tabIcons[id];
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-desktop-${id}`}
                aria-selected={selected}
                aria-controls={`panel-${id}`}
                onClick={() => {
                  setTab(id);
                }}
                className={
                  selected
                    ? "inline-flex items-center gap-2 border-b-2 border-[#3d34b8] px-3 py-3 text-sm font-medium text-[#3d34b8]"
                    : "inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm text-[#5c6b78]"
                }
              >
                <Icon className="size-4" aria-hidden />
                {companyCopy.tabs[id]}
              </button>
            );
          })}
        </div>
      </div>
      {/* S43 (Alex): the filter is centred on the tab row, not dropped to its bottom edge. */}
      {actions ? <div className="flex flex-wrap items-center gap-2 py-1 sm:justify-end" data-tab-actions>{actions}</div> : null}
      </div>
      {notice}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {panels[tab]}
      </div>
    </>
  );
}
