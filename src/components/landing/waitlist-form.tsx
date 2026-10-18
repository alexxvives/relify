"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Briefcase, Building2, Landmark } from "lucide-react";
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

const steps = [
  { id: "company" as const, title: "Empresa", body: "Te avisamos para publicar." },
  { id: "investor" as const, title: "Inversor", body: "Te avisamos para leer el catálogo." },
  { id: "advisor" as const, title: "Asesor", body: "Te avisamos para traer un mandato." },
];

const initial: WaitlistState = { status: "idle" };

export function WaitlistBoard() {
  const [role, setRole] = useState<Role>("company");
  return (
    <div className="releva-wait" data-role={role}>
      <div className="releva-wait-sky" aria-hidden="true">
        <span className="releva-wait-orb releva-wait-orb-a" />
        <span className="releva-wait-orb releva-wait-orb-b" />
        <span className="releva-wait-orb releva-wait-orb-c" />
        <span className="releva-wait-grid" />
      </div>
      <div className="releva-wait-marquee" aria-hidden="true">
        <p>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index}>Empresa · Inversor · Asesor · Antes de abrir · </span>
          ))}
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:py-20">
        <div>
          <p className="releva-wait-kicker">{waitlistCopy.kicker}</p>
          <h1 className="releva-wait-title">
            Entra antes de que
            <span> el mercado esté lleno</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">{waitlistCopy.body}</p>
          <div className="releva-wait-orbit" aria-hidden="true">
            {seats.map((seed, index) => (
              <span key={seed} className="releva-wait-face" style={{ animationDelay: `${index * -1.4}s` }}>
                <img src={gazeAvatarUrl(seed)} alt="" width={64} height={64} />
              </span>
            ))}
          </div>
        </div>
        <WaitlistForm role={role} onRole={setRole} />
      </div>
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-5 pb-20 sm:px-8">
        <section aria-label="Tres puertas" className="grid gap-4 md:grid-cols-3">
          {waitlistCopy.roles.map((item, index) => {
            const Icon = icons[item.id];
            const live = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`releva-wait-door ${live ? "is-live" : ""}`}
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <span className="releva-wait-door-index">0{index + 1}</span>
                <Icon className="size-6" aria-hidden="true" />
                <span className="mt-8 block text-3xl tracking-tight">{item.label}</span>
                <span className="mt-2 block text-sm leading-6 text-white/70">{item.line}</span>
              </button>
            );
          })}
        </section>
        <section aria-label="Qué pasa al apuntarte" className="releva-wait-strip">
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((item, index) => (
              <li key={item.id} className={role === item.id ? "is-live" : ""}>
                <p className="text-xs tracking-[0.22em] text-white/45 uppercase">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 text-xl">{item.title}</p>
                <p className="mt-1 text-sm text-white/65">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>
        <p className="releva-wait-note">Ni razón social, ni CIF, ni documentos.</p>
      </div>
    </div>
  );
}

export function WaitlistForm({ role, onRole }: { role: Role; onRole: (role: Role) => void }) {
  const [state, action, pending] = useActionState(joinWaitlistAction, initial);

  if (state.status === "ok") {
    return (
      <div className="releva-wait-card releva-wait-done">
        <p className="text-sm tracking-[0.18em] text-white/55 uppercase">{waitlistCopy.kicker}</p>
        <h2 className="mt-3 font-serif text-5xl italic">{waitlistCopy.doneTitle}</h2>
        <p className="mt-4 max-w-md text-base leading-7 text-white/75">{waitlistCopy.doneBody}</p>
        <button type="button" className="releva-wait-submit mt-8" onClick={() => window.location.reload()}>
          {waitlistCopy.again}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="releva-wait-card">
      <h2 className="font-serif text-4xl italic">{waitlistCopy.formTitle}</h2>
      <fieldset className="mt-6">
        <legend className="text-sm text-white/55">Perfil</legend>
        <div className="mt-3 grid gap-2">
          {waitlistCopy.roles.map((item) => {
            const Icon = icons[item.id];
            const selected = role === item.id;
            return (
              <label key={item.id} className={`releva-wait-role ${selected ? "is-on" : ""}`}>
                <input type="radio" name="role" value={item.id} checked={selected} onChange={() => onRole(item.id)} />
                <span className="grid size-9 place-items-center rounded-full bg-white/10">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-sm text-white/60">{item.line}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm text-white/80">
          {waitlistCopy.name}
          <input name="name" required minLength={2} autoComplete="name" className="releva-wait-field" />
        </label>
        <label className="grid gap-1.5 text-sm text-white/80">
          {waitlistCopy.email}
          <input name="email" type="email" required autoComplete="email" className="releva-wait-field" />
        </label>
        <label className="grid gap-1.5 text-sm text-white/80">
          {waitlistCopy.city}
          <span className="sr-only">{waitlistCopy.cityHint}</span>
          <input name="city" autoComplete="address-level2" placeholder={waitlistCopy.cityHint} className="releva-wait-field" />
        </label>
      </div>
      {state.status === "error" ? <p className="mt-4 text-sm text-red-200">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="releva-wait-submit mt-6">
        {pending ? waitlistCopy.pending : waitlistCopy.submit}
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
