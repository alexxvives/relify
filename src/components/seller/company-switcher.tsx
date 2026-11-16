"use client";

import { useActionState, useEffect, useId, useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { CheckIcon } from "@/components/ui/check";
import { ChevronDownIcon } from "@/components/ui/chevron-down";
import { Trash2Icon } from "@/components/ui/trash-2";
import { PlusIcon } from "@/components/ui/plus";
import { Info } from "lucide-react";
import { AlertDot, CountBadge } from "@/components/ui/badge";
import { addSellerCompanyAction, deleteSellerCompanyAction, selectSellerCompanyAction } from "@/app/(app)/mi-empresa/actions";
import { noticesForCompany, type NotificationView } from "@/lib/notifications";
import { sellerCompanyLabel } from "@/lib/seller-company";
import { sellerCopy } from "@/lib/seller-copy";
import { Button, Input } from "@/components/ui/form";

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] open:block backdrop:bg-[#1c2740]/40";

function AddCompanyButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-public-clay hover:bg-public-sand"
    >
      <PlusIcon size={16} aria-hidden />
      {sellerCopy.addCompany}
    </button>
  );
}

/** Compact "Añadir empresa" beside the bell when the seller has no company yet; label as tooltip. */
export function AddCompanyIconButton() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label={sellerCopy.addCompany}
        className="group/add relative inline-flex size-10 items-center justify-center rounded-full text-public-clay hover:bg-public-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
      >
        <PlusIcon size={18} aria-hidden />
        <span
          role="tooltip"
          className="pointer-events-none absolute top-full left-1/2 z-30 mt-1 -translate-x-1/2 rounded-md bg-[#1c2740] px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover/add:opacity-100 group-focus-visible/add:opacity-100"
        >
          {sellerCopy.addCompany}
        </span>
      </button>
      <AddCompanyDialog dialogRef={ref} />
    </>
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
            <p className="text-[#3d4a63]">{sellerCopy.addCompanyBody}</p>
          </div>
        </div>
        <label className="mt-4 block text-sm font-medium text-[#1c2740]" htmlFor="nueva-empresa-cif">
          {sellerCopy.addCompanyCif}
          <Input
            id="nueva-empresa-cif"
            name="cif"
            required
            autoComplete="off"
            placeholder={sellerCopy.addCompanyCifPlaceholder}
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
          <Button
            type="submit"
            disabled={pending}
            className="rounded-full text-sm"
>
            {pending ? sellerCopy.addCompanyPending : sellerCopy.addCompanySubmit}
          </Button>
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
  unreadElsewhere,
}: {
  companies: { id: string; legalName: string; codename: string; pending?: number }[];
  activeId: string | null;
  notices: NotificationView[];
  /** Unread notices per non-active company id. */
  unreadElsewhere?: Record<string, number>;
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
    // No company yet: the shell shows AddCompanyIconButton beside the bell instead.
    return null;
  }

  const currentLabel = sellerCompanyLabel(current.legalName, current.codename);
  const unreadFor = (company: { id: string; codename: string }) =>
    unreadElsewhere ? (unreadElsewhere[company.id] ?? 0) : noticesForCompany(company.codename, notices);
  const elsewhere = companies.reduce((sum, company) => (company.id === current.id ? sum : sum + unreadFor(company)), 0);
  const pendingTotal = companies.reduce((sum, company) => sum + (company.pending ?? 0), 0);

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
        aria-label={`${sellerCopy.companiesCurrent}: ${currentLabel}`}
        className="relative flex h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-[#222839] px-3 text-left text-white transition-colors duration-150 hover:bg-[#2a3146] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2fc4b2]"
      >
        <span aria-hidden className="relative inline-flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#34d399] opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2.5 rounded-full bg-[#34d399]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{currentLabel}</span>
        {pendingTotal > 0 ? (
          <CountBadge count={pendingTotal} ring className="absolute -top-2 -right-2" label={`${pendingTotal} acciones pendientes`} />
        ) : elsewhere > 0 ? (
          <AlertDot ring className="absolute -top-1 -right-1" label={`${elsewhere} novedades en otras empresas`} />
        ) : null}
        <ChevronDownIcon size={16} className={open ? "shrink-0 rotate-180 text-[#aeb6c7]" : "shrink-0 text-[#aeb6c7]"} aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label={sellerCopy.companiesLabel}
          className="absolute top-14 left-0 z-50 w-[max(100%,min(20rem,calc(100vw-2rem)))] overflow-hidden rounded-2xl border border-public-line bg-white shadow-[0_18px_50px_-28px_rgba(28,39,64,0.45)]"
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {companies.map((company) => {
              const selected = company.id === current.id;
              const label = sellerCompanyLabel(company.legalName, company.codename);
              const unread = unreadFor(company);
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
                      {(company.pending ?? 0) > 0 ? (
                        <CountBadge count={company.pending ?? 0} label={`${company.pending ?? 0} acciones pendientes`} />
                      ) : !selected && unread > 0 ? (
                        <AlertDot label={`${unread} novedades`} />
                      ) : null}
                    </button>
                  </form>
                  <CompanyDelete id={company.id} />
                </div>
              );
            })}
          </div>
          <div className="border-t border-public-line p-1">
            <AddCompanyButton onOpen={openAdd} />
          </div>
        </div>
      ) : null}
      <AddCompanyDialog dialogRef={addDialogRef} />
    </div>
  );
}
