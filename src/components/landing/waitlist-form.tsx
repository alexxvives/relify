"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Building2, Briefcase, Landmark } from "lucide-react";
import { joinWaitlistAction, type WaitlistState } from "@/app/lista-de-espera/actions";
import { gazeAvatarUrl } from "@/lib/gaze-avatar";
import { waitlistCopy, type waitlistRoles } from "@/lib/waitlist";

type Role = (typeof waitlistRoles)[number];

const icons = {
  company: Building2,
  investor: Landmark,
  advisor: Briefcase,
} as const;

const seats = ["alba", "nube", "cala", "duna", "bruma", "olivo", "roble", "faro"] as const;

const initial: WaitlistState = { status: "idle" };

export function WaitlistForm() {
  const [role, setRole] = useState<Role>("company");
  const [state, action, pending] = useActionState(joinWaitlistAction, initial);

  if (state.status === "ok") {
    return (
      <div className="rounded-[2rem] bg-public-ink px-8 py-12 text-white shadow-public">
        <p className="text-sm tracking-[0.16em] text-white/60 uppercase">{waitlistCopy.kicker}</p>
        <h2 className="mt-3 text-4xl tracking-tight">{waitlistCopy.doneTitle}</h2>
        <p className="mt-4 max-w-md text-[16px] leading-7 text-white/75">{waitlistCopy.doneBody}</p>
        <button
          type="button"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-6 text-public-ink"
          onClick={() => window.location.reload()}
        >
          {waitlistCopy.again}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-[2rem] bg-public-card p-6 shadow-public sm:p-8">
      <h2 className="text-2xl tracking-tight">{waitlistCopy.formTitle}</h2>
      <fieldset className="mt-6">
        <legend className="text-sm text-public-muted">Perfil</legend>
        <div className="mt-3 grid gap-3">
          {waitlistCopy.roles.map((item) => {
            const Icon = icons[item.id];
            const selected = role === item.id;
            return (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${selected ? "border-public-clay bg-public-sand" : "border-public-line bg-white"}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={item.id}
                  checked={selected}
                  className="mt-1"
                  onChange={() => setRole(item.id)}
                />
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-public-ink text-white">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-sm text-public-muted">{item.line}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm">
          {waitlistCopy.name}
          <input name="name" required minLength={2} autoComplete="name" className="h-12 rounded-2xl border border-public-line bg-white px-4 text-base" />
        </label>
        <label className="grid gap-1.5 text-sm">
          {waitlistCopy.email}
          <input name="email" type="email" required autoComplete="email" className="h-12 rounded-2xl border border-public-line bg-white px-4 text-base" />
        </label>
        <label className="grid gap-1.5 text-sm">
          {waitlistCopy.city}
          <span className="sr-only">{waitlistCopy.cityHint}</span>
          <input name="city" autoComplete="address-level2" placeholder={waitlistCopy.cityHint} className="h-12 rounded-2xl border border-public-line bg-white px-4 text-base" />
        </label>
      </div>
      {state.status === "error" ? <p className="mt-4 text-sm text-red-700">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white hover:bg-public-clay-deep disabled:opacity-60"
      >
        {pending ? waitlistCopy.pending : waitlistCopy.submit}
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

export function WaitlistSeats() {
  return (
    <ul className="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-8">
      {seats.map((seed, index) => (
        <li key={seed} className="releva-seat" style={{ animationDelay: `${index * 0.12}s` }}>
          <img src={gazeAvatarUrl(seed)} alt="" width={72} height={72} className="size-full object-cover" />
        </li>
      ))}
    </ul>
  );
}
