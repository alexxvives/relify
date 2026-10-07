"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { createSellerCompanyAction, selectSellerCompanyAction } from "@/app/mi-empresa/actions";
import { noticesForCompany, type NotificationView } from "@/lib/notifications";
import { sellerCompanyLabel } from "@/lib/seller-company";
import { sellerCopy } from "@/lib/seller-copy";

export function CompanySwitcher({
  companies,
  activeId,
  notices,
}: {
  companies: { id: string; legalName: string; codename: string }[];
  activeId: string | null;
  notices: NotificationView[];
}) {
  const pathname = usePathname();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const current = companies.find((company) => company.id === activeId) ?? companies[0];

  useEffect(() => {
    function close(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, []);

  if (!current) {
    return null;
  }

  const currentLabel = sellerCompanyLabel(current.legalName, sellerCopy.unnamedCompany);
  const currentUnread = noticesForCompany(current.codename, notices);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="inline-flex h-11 max-w-72 items-center gap-2 rounded-full border border-public-line bg-public-paper px-3 text-sm font-medium text-public-ink hover:bg-public-sand"
      >
        <span className="truncate">{currentLabel}</span>
        {currentUnread > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-public-clay px-1.5 text-[10px] leading-5 font-semibold text-white">
            {currentUnread > 9 ? "9+" : currentUnread}
          </span>
        ) : null}
        <ChevronDown className={open ? "size-4 shrink-0 rotate-180 text-public-muted" : "size-4 shrink-0 text-public-muted"} aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label={sellerCopy.companiesLabel}
          className="absolute top-12 left-0 z-50 w-96 overflow-hidden rounded-2xl border border-public-line bg-white shadow-[0_18px_50px_-28px_rgba(28,39,64,0.45)]"
        >
          <p className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-public-muted">{sellerCopy.companiesCurrent}</p>
          <div className="max-h-64 overflow-y-auto p-1">
            {companies.map((company) => {
              const selected = company.id === current.id;
              const label = sellerCompanyLabel(company.legalName, sellerCopy.unnamedCompany);
              const unread = noticesForCompany(company.codename, notices);
              return (
                <form key={company.id} action={selectSellerCompanyAction}>
                  <input type="hidden" name="projectId" value={company.id} />
                  <input type="hidden" name="next" value={pathname} />
                  <button
                    type="submit"
                    role="option"
                    aria-selected={selected}
                    className={
                      selected
                        ? "flex h-11 w-full items-center gap-2 rounded-xl bg-[#f4f7ff] px-3 text-left text-sm font-medium text-public-ink"
                        : "flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-public-muted hover:bg-public-sand hover:text-public-ink"
                    }
                  >
                    <Check className={selected ? "size-4 shrink-0 text-[#465ab4]" : "size-4 shrink-0 text-transparent"} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {unread > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-public-clay px-1.5 text-[10px] leading-5 font-semibold text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                  </button>
                </form>
              );
            })}
          </div>
          <form action={createSellerCompanyAction} className="border-t border-public-line p-1">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-public-clay hover:bg-public-sand"
            >
              <Plus className="size-4" aria-hidden />
              {sellerCopy.addCompany}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
