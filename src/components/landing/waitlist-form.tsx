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

export function WaitlistBoard() {
  const [role, setRole] = useState<Role>("company");
  return (
    <>
      <div className="mx-auto grid w-full max-w-[1440px] items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div>
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{waitlistCopy.kicker}</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">{waitlistCopy.heading}</h1>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-public-muted">{waitlistCopy.body}</p>
        </div>
        <WaitlistForm role={role} onRole={setRole} />
      </div>
      <div className="mx-auto mt-14 grid w-full max-w-[1440px] gap-6">
        <section className="rounded-[2rem] bg-public-card p-5 shadow-public sm:p-8" aria-label="Tres puertas">
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">Tres puertas</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {waitlistCopy.roles.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`rounded-[1.4rem] px-5 py-8 text-left ${role === item.id ? "bg-public-ink text-white" : "bg-[#f4f1ea]"}`}
              >
                <p className="text-2xl tracking-tight">{item.label}</p>
                <p className={`mt-2 text-sm ${role === item.id ? "text-white/70" : "text-public-muted"}`}>{item.line}</p>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-[2rem] bg-public-card p-5 shadow-public sm:p-8" aria-label="Qué pasa al apuntarte">
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">Qué pasa al apuntarte</p>
          <ol className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { title: "Empresa", body: "Te avisamos para publicar.", live: role === "company" },
              { title: "Inversor", body: "Te avisamos para leer el catálogo.", live: role === "investor" },
              { title: "Asesor", body: "Te avisamos para traer un mandato.", live: role === "advisor" },
            ].map((item, index) => (
              <li key={item.title} className={`rounded-[1.4rem] px-5 py-6 ${item.live ? "bg-public-ink text-white" : "bg-[#f4f1ea]"}`}>
                <p className={`text-xs tracking-[0.14em] uppercase ${item.live ? "text-white/50" : "text-public-muted"}`}>{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-3 text-xl tracking-tight">{item.title}</p>
                <p className={`mt-2 text-sm leading-6 ${item.live ? "text-white/70" : "text-public-muted"}`}>{item.body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-[2rem] bg-public-card p-5 shadow-public sm:p-8" aria-label="Qué no pedimos">
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">Qué no pedimos</p>
          <p className="mt-6 rounded-[1.2rem] bg-public-ink px-6 py-6 text-lg text-white">Ni razón social, ni CIF, ni documentos.</p>
        </section>
      </div>
    </>
  );
}

export function WaitlistForm({ role, onRole }: { role: Role; onRole: (role: Role) => void }) {
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
                  onChange={() => onRole(item.id)}
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
