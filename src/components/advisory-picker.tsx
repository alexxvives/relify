"use client";

import { useActionState, useState } from "react";
import { Briefcase, Calculator, FileSpreadsheet, Scale, Search, Users } from "lucide-react";
import { requestAdvisoryQuoteAction, type AdvisoryQuoteState } from "@/app/asesoramiento/actions";
import { advisoryCopy, advisoryServices, type AdvisoryServiceId } from "@/lib/advisory";

const icons = {
  "due-diligence": Search,
  valuation: Calculator,
  legal: Scale,
  tax: FileSpreadsheet,
  "business-plan": Briefcase,
  labor: Users,
} as const;

export function AdvisoryPicker({ layout = "list" }: { layout?: "list" | "cards" }) {
  const [state, action, pending] = useActionState<AdvisoryQuoteState, FormData>(requestAdvisoryQuoteAction, null);
  const [selected, setSelected] = useState<AdvisoryServiceId[]>([]);

  function toggle(id: AdvisoryServiceId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {selected.map((id) => (
        <input key={id} type="hidden" name="services" value={id} />
      ))}
      <ul className={layout === "cards" ? "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
        {advisoryServices.map((service) => {
          const Icon = icons[service.id];
          const active = selected.includes(service.id);
          return (
            <li key={service.id}>
              <label
                className={
                  layout === "cards"
                    ? active
                      ? "flex h-full cursor-pointer items-start gap-3 rounded-xl border border-[#465ab4] bg-white p-4"
                      : "flex h-full cursor-pointer items-start gap-3 rounded-xl border border-[#e7eaee] bg-white p-4"
                    : active
                      ? "flex cursor-pointer gap-4 rounded-2xl border border-[#3d34b8] bg-[#f7f6ff] p-4"
                      : "flex cursor-pointer gap-4 rounded-2xl border border-[#e6e9f0] bg-white p-4"
                }
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-[#465ab4]"
                  checked={active}
                  onChange={() => {
                    toggle(service.id);
                  }}
                />
                {layout === "list" ? (
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f1ff] text-[#3d34b8]">
                    <Icon className="size-4" aria-hidden />
                  </span>
                ) : null}
                <span>
                  <span className="block text-sm font-semibold">{service.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[#5c6b78]">{service.body}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {state ? (
        <p role="status" className={state.ok ? "text-sm text-[#1c2740]" : "text-sm text-red-700"}>
          {state.message}
        </p>
      ) : null}
      <div className={layout === "cards" ? "mt-8 flex items-center justify-end gap-4" : "flex flex-wrap items-center justify-between gap-3"}>
        <button
          type="button"
          onClick={() => {
            setSelected([]);
          }}
          className="text-sm font-medium text-[#3d4a63] hover:text-[#3d34b8]"
        >
          {advisoryCopy.clear}
        </button>
        <button
          type="submit"
          disabled={pending || selected.length === 0}
          className={
            layout === "cards"
              ? "inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:bg-[#e6e8f6] disabled:text-[#9aa3c7]"
              : "inline-flex h-11 items-center rounded-xl bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60"
          }
        >
          {pending ? advisoryCopy.pending : advisoryCopy.submit}
        </button>
      </div>
    </form>
  );
}
