"use client";

import { useActionState, useEffect, useId, useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { CheckIcon } from "@/components/ui/check";
import { ChevronDownIcon } from "@/components/ui/chevron-down";
import { Trash2Icon } from "@/components/ui/trash-2";
import { PlusIcon } from "@/components/ui/plus";
import { Info } from "lucide-react";
import { addSellerCompanyAction, deleteSellerCompanyAction, selectSellerCompanyAction } from "@/app/mi-empresa/actions";
import { noticesForCompany, type NotificationView } from "@/lib/notifications";
import { sellerCompanyLabel } from "@/lib/seller-company";
import { sellerCopy } from "@/lib/seller-copy";

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] open:block backdrop:bg-[#1c2740]/40";

function AddCompanyButton({ prominent, onOpen }: { prominent: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        prominent
          ? "flex h-12 w-full items-center gap-2 rounded-xl border border-dashed border-public-line bg-public-paper px-3 text-sm font-medium text-public-ink hover:bg-public-sand"
          : "inline-flex h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-public-clay hover:bg-public-sand"
      }
    >
      <PlusIcon size={16} aria-hidden />
      {sellerCopy.addCompany}
    </button>
  );
}

/** Standalone "publish another company" entry (used after a sale). */
export function ListAnotherCompany() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4]"
      >
        <PlusIcon size={14} aria-hidden />
        {sellerCopy.addCompany}
      </button>
      <AddCompanyDialog dialogRef={ref} />
    </>
  );
}

function AddCompanyDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  const [state, action, pending] = useActionState(addSellerCompanyAction, null);

  return (
    <dialog ref={dialogRef} className={dialogClass}>
      <form action={action}>
        <h2 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.addCompanyTitle}</h2>
        <div role="note" className="mt-4 flex gap-3 rounded-xl border border-[#c9d3f3] bg-[#f4f7ff] p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-[#465ab4]" aria-hidden />
          <div className="text-[15px] leading-6 text-[#1c2740]">
            <p className="font-semibold">{sellerCopy.addCompanyFreeTitle}</p>
            <p className="mt-1 text-[#3d4a63]">{sellerCopy.addCompanyBody}</p>
          </div>
        </div>
        <label className="mt-4 block text-sm font-medium text-[#1c2740]" htmlFor="nueva-empresa-cif">
          {sellerCopy.addCompanyCif}
          <input
            id="nueva-empresa-cif"
            name="cif"
            required
            autoComplete="off"
            className="mt-1 h-11 w-full rounded-xl border border-[#e1e6ee] bg-[#f4f7ff] px-3 text-sm"
          />
        </label>
        {state ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {state.message}
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
            }}
            className="inline-flex h-11 items-center rounded-full border border-[#e1e6ee] px-4 text-sm font-medium"
          >
            {sellerCopy.closeDocument}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? sellerCopy.addCompanyPending : sellerCopy.addCompanySubmit}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function CompanyDelete({ id }: { id: string }) {
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={sellerCopy.deleteCompany}
        onClick={() => {
          setConfirming(true);
        }}
        className="inline-flex size-8 items-center justify-center rounded-full text-[#8b95a7] hover:bg-[#fff1f1] hover:text-red-700"
      >
        <Trash2Icon size={16} aria-hidden />
      </button>
    );
  }

  return (
    <form action={deleteSellerCompanyAction}>
      <input type="hidden" name="projectId" value={id} />
      <input type="hidden" name="next" value={pathname} />
      <button
        type="submit"
        className="inline-flex h-8 items-center rounded-full bg-red-700 px-2 text-xs font-medium text-white"
      >
        {sellerCopy.deleteCompany}
      </button>
    </form>
  );
}

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
  const addDialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function openAdd() {
    setOpen(false);
    addDialogRef.current?.showModal();
  }
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
    return (
      <>
        <AddCompanyButton prominent onOpen={openAdd} />
        <AddCompanyDialog dialogRef={addDialogRef} />
      </>
    );
  }

  const currentLabel = sellerCompanyLabel(current.legalName, current.codename);

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-public-line bg-public-paper px-2.5 text-left text-public-ink transition-colors duration-150 hover:bg-public-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4]"
      >
        <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#465ab4] text-sm font-semibold text-white">
          {currentLabel.trim().charAt(0).toUpperCase() || "E"}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-xs font-medium text-public-muted">{sellerCopy.companiesCurrent}</span>
          <span className="truncate text-sm font-medium">{currentLabel}</span>
        </span>
        <ChevronDownIcon size={16} className={open ? "shrink-0 rotate-180 text-public-muted" : "shrink-0 text-public-muted"} aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label={sellerCopy.companiesLabel}
          className="absolute top-14 left-0 z-50 w-[max(100%,min(20rem,calc(100vw-2rem)))] overflow-hidden rounded-2xl border border-public-line bg-white shadow-[0_18px_50px_-28px_rgba(28,39,64,0.45)]"
        >
          <p className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-public-muted">{sellerCopy.companiesCurrent}</p>
          <div className="max-h-64 overflow-y-auto p-1">
            {companies.map((company) => {
              const selected = company.id === current.id;
              const label = sellerCompanyLabel(company.legalName, company.codename);
              const unread = noticesForCompany(company.codename, notices);
              return (
                <div key={company.id} className="flex items-center gap-1">
                  <form action={selectSellerCompanyAction} className="min-w-0 flex-1">
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
                      <CheckIcon size={16} className={selected ? "text-[#465ab4]" : "text-transparent"} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {!selected && unread > 0 ? (
                        <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-public-clay px-1 text-xs leading-4 font-semibold text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      ) : null}
                    </button>
                  </form>
                  <CompanyDelete id={company.id} />
                </div>
              );
            })}
          </div>
          <div className="border-t border-public-line p-1">
            <AddCompanyButton prominent={false} onOpen={openAdd} />
          </div>
        </div>
      ) : null}
      <AddCompanyDialog dialogRef={addDialogRef} />
    </div>
  );
}
