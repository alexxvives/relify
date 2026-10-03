"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeftRight, Building2, Calendar, FileText, MessageCircle } from "lucide-react";
import { companyCopy } from "@/lib/company-copy";

const tabs = [
  { id: "company", label: companyCopy.tabs.company, icon: Building2 },
  { id: "transaction", label: companyCopy.tabs.transaction, icon: ArrowLeftRight },
  { id: "questions", label: companyCopy.tabs.questions, icon: MessageCircle },
  { id: "meetings", label: companyCopy.tabs.meetings, icon: Calendar },
  { id: "offer", label: companyCopy.tabs.offer, icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function InvestorProjectTabs({ panels }: { panels: Record<TabId, ReactNode> }) {
  const [tab, setTab] = useState<TabId>("company");

  return (
    <>
      <div className="overflow-x-auto">
        <div role="tablist" aria-label={companyCopy.tabsLabel} className="flex min-w-max gap-1 border-b border-[#e6e9f0]">
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
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {panels[tab]}
      </div>
    </>
  );
}
