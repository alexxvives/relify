"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import {
  acceptBuyerAction,
  recordAdvisorSaleAction,
  type MandateActionState,
} from "@/app/mandatos/actions";
import { advisorCopy } from "@/lib/advisor-copy";
import type { PendingMatch } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import { keepUnsignedEuro } from "@/lib/numeric-input";

export type MandateDisplay = {
  slug: string;
  codename: string;
  region: string;
  status: "draft" | "pending" | "published";
  feeRecorded: boolean;
  owned: boolean;
  figures: { label: string; value: string }[];
};

function Note({ state }: { state: MandateActionState }) {
  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-[#157a45]" : "text-sm text-red-700"} role={state.ok ? undefined : "alert"}>
      {state.message}
    </p>
  );
}

function MandateFigures({ project }: { project: MandateDisplay }) {
  return (
    <dl className="grid grid-cols-2 gap-4">
      {project.figures.map((figure) => (
        <div key={figure.label}>
          <dt className="text-xs text-muted-foreground">{figure.label}</dt>
          <dd className="mt-1 text-sm font-medium">{figure.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SaleForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(recordAdvisorSaleAction, null);

  return (
    <form action={action} className="mt-4 flex flex-col items-start gap-2">
      <label className="text-sm">
        {billingCopy.salePrice}
        <input name="price" required inputMode="decimal" onChange={keepEuroField} className="mt-1 h-10 rounded-xl border border-[#d0d5dd] px-3" />
      </label>
      <p className="text-xs text-[#667085]">{billingCopy.saleHint}</p>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-full border border-[#d0d5dd] px-4 text-sm"
      >
        {pending ? billingCopy.recordingSale : billingCopy.recordSale}
      </button>
      <Note state={state} />
    </form>
  );
}

function PendingList({ pending }: { pending: PendingMatch[] }) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold">{billingCopy.pendingTitle}</h3>
      <p className="mt-1 text-sm text-[#64748b]">{billingCopy.pendingBody}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {pending.map((item) => (
          <PendingItem key={item.accessId} item={item} />
        ))}
      </ul>
    </div>
  );
}

function PendingItem({ item }: { item: PendingMatch }) {
  const [state, action, pending] = useActionState(acceptBuyerAction, null);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f7f8fb] px-3 py-3">
      <p className="text-sm font-medium">
        {item.label}
        <span className="ml-2 font-normal text-[#64748b]">{item.codename}</span>
      </p>
      <form action={action} className="flex flex-col items-end gap-1">
        <input type="hidden" name="accessId" value={item.accessId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-[#3d34b8] px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? billingCopy.acceptingBuyer : billingCopy.acceptBuyer}
        </button>
        <Note state={state} />
      </form>
    </li>
  );
}

type StatusFilter = "all" | MandateDisplay["status"];

const statusLabel: Record<MandateDisplay["status"], string> = { draft: "Borrador", pending: "Pendiente", published: "Publicado" };
const statusTone: Record<MandateDisplay["status"], string> = {
  draft: "bg-[#f1f3f8] text-[#475467]",
  pending: "bg-[#fff4e5] text-[#9a5b00]",
  published: "bg-[#e8f5ee] text-[#157a45]",
};

function nextStep(project: MandateDisplay): string {
  if (project.feeRecorded) return "Venta registrada. Nada pendiente.";
  if (project.status === "draft") return "El vendedor completa la ficha y la envía a revisión.";
  if (project.status === "pending") return "Releva revisa la ficha antes de publicarla.";
  return "Acepta compradores y registra la venta al cerrar.";
}

function MandateCard({ project }: { project: MandateDisplay }) {
  const live = project.status === "published";

  return (
    <li className="rounded-2xl border border-[#e7eaee] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#2b3b4a]">{project.codename}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[project.status]}`}>{statusLabel[project.status]}</span>
      </div>
      <p className="mt-1 text-sm text-[#64748b]">{project.region}</p>
      <p className="mt-2 text-sm text-[#2b3b4a]">
        <span className="font-medium">Siguiente paso: </span>
        {nextStep(project)}
      </p>
      <div className="mt-4">
        <MandateFigures project={project} />
      </div>
      {live ? null : <p className="mt-4 text-sm text-[#64748b]">{billingCopy.advisorDoesNotPublish}</p>}
      {live ? (
        <Link href={`/proyectos/${project.slug}`} className="mt-4 inline-flex text-sm text-[#3d34b8]">
          {advisorCopy.viewPublicCard}
        </Link>
      ) : null}
      {live && !project.feeRecorded ? <SaleForm slug={project.slug} /> : null}
      {project.feeRecorded ? <p className="mt-3 text-sm text-[#157a45]">{billingCopy.feeLabel}</p> : null}
    </li>
  );
}

export function AdvisorMandateBoard({
  mandates,
  pending,
}: {
  mandates: MandateDisplay[];
  pending: PendingMatch[];
}) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const shown = filter === "all" ? mandates : mandates.filter((item) => item.status === filter);
  return (
    <div className="mt-6">
      <p className="text-sm text-[#64748b]">{billingCopy.advisorDoesNotPublish}</p>
      {mandates.length === 0 ? (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f4f4f5] text-[#64748b]">
            <Package className="size-5" aria-hidden />
          </span>
          <h3 className="mt-4 text-base font-semibold text-[#2b3b4a]">{advisorCopy.mandatesEmpty}</h3>
          <p className="mt-2 text-sm text-[#64748b]">{advisorCopy.mandatesEmptyBody}</p>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Estado del mandato" className="mt-6 flex flex-wrap gap-2">
            {(["all", "draft", "pending", "published"] as const).map((id) => {
              const count = id === "all" ? mandates.length : mandates.filter((item) => item.status === id).length;
              const active = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(id)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${active ? "border-[#465ab4] bg-[#465ab4] text-white" : "border-[#e1e6ee] bg-white text-[#1c2740] hover:bg-[#f4f6fb]"}`}
                >
                  {id === "all" ? "Todos" : statusLabel[id]}
                  <span className={`tabular-nums ${active ? "text-white/80" : "text-[#64748b]"}`}>{count}</span>
                </button>
              );
            })}
          </div>
          {shown.length === 0 ? (
            <p className="mt-6 text-sm text-[#64748b]">No hay mandatos en este estado.</p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {shown.map((project) => (
                <MandateCard key={project.slug} project={project} />
              ))}
            </ul>
          )}
        </>
      )}
      {pending.length > 0 ? <PendingList pending={pending} /> : null}
    </div>
  );
}

function keepEuroField(event: ChangeEvent<HTMLInputElement>) {
  event.currentTarget.value = keepUnsignedEuro(event.currentTarget.value);
}
