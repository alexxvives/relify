"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { ArrowRight, Briefcase, Building2, Landmark } from "lucide-react";
import { joinWaitlistAction, type WaitlistState } from "@/app/lista-de-espera/actions";
import { gazeAvatarUrl } from "@/lib/gaze-avatar";
import { waitlistCopy, waitlistOpensAt, type waitlistRoles } from "@/lib/waitlist";

type Role = (typeof waitlistRoles)[number];

const icons = {
  company: Building2,
  investor: Landmark,
  advisor: Briefcase,
} as const;

const seats = ["alba", "nube", "cala", "duna", "bruma", "olivo", "roble", "faro"] as const;
const opensAt = new Date(waitlistOpensAt).getTime();
const initial: WaitlistState = { status: "idle" };

function partsLeft(now: number) {
  const left = Math.max(0, opensAt - now);
  const day = 86_400_000;
  const hour = 3_600_000;
  const minute = 60_000;
  return [
    { label: "días", value: Math.floor(left / day) },
    { label: "horas", value: Math.floor((left % day) / hour) },
    { label: "minutos", value: Math.floor((left % hour) / minute) },
    { label: "segundos", value: Math.floor((left % minute) / 1000) },
  ];
}

function FlipUnit({ value, previous, label }: { value: string; previous: string; label: string }) {
  const play = value !== previous;
  return (
    <li>
      <div className="releva-flip">
        <b>{value}</b>
        {play ? (
          <span className="releva-flip-leaf" key={value}>
            <span>{previous}</span>
          </span>
        ) : null}
      </div>
      <span>{label}</span>
    </li>
  );
}

function WaitlistClock() {
  const [clock, setClock] = useState<{ now: number | null; previous: number | null }>({ now: null, previous: null });

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock((current) => ({ now: Date.now(), previous: current.now }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const now = clock.now;
  const parts = partsLeft(now ?? opensAt);
  const before = partsLeft(clock.previous ?? now ?? opensAt);

  return (
    <div className="releva-wait-clock" aria-label="Queda un mes para abrir">
      <ol>
        {parts.map((part, index) => (
          <FlipUnit
            key={part.label}
            value={now === null ? "00" : String(part.value).padStart(2, "0")}
            previous={now === null ? "00" : String(before[index]?.value ?? part.value).padStart(2, "0")}
            label={part.label}
          />
        ))}
      </ol>
    </div>
  );
}

export function WaitlistBoard() {
  const [role, setRole] = useState<Role>("company");
  return (
    <div className="releva-wait" data-role={role}>
      <div className="releva-wait-sky" aria-hidden="true">
        <span className="releva-wait-wash" />
        <span className="releva-wait-arc" />
        <span className="releva-wait-orb releva-wait-orb-a" />
        <span className="releva-wait-orb releva-wait-orb-b" />
        <span className="releva-wait-orb releva-wait-orb-c" />
      </div>
      <div className="releva-wait-layout">
        <div>
          <h1 className="releva-wait-title">
            Apúntate para entrar
            <span>en el marketplace</span>
          </h1>
          <p className="releva-wait-body sm:hidden">{waitlistCopy.bodyShort}</p>
          <p className="releva-wait-body hidden sm:block">{waitlistCopy.body}</p>
          <div className="releva-wait-orbit hidden sm:flex" aria-hidden="true">
            {seats.map((seed, index) => (
              <span key={seed} className="releva-wait-face" style={{ animationDelay: `${index * -1.4}s` }}>
                <Image src={gazeAvatarUrl(seed)} alt="" width={64} height={64} unoptimized />
              </span>
            ))}
          </div>
        </div>
        <WaitlistForm role={role} onRole={setRole} />
      </div>
      <div className="releva-wait-marquee" aria-hidden="true">
        <p>
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index}>Empresa · Comprador · Asesor ·{"\u00a0"}</span>
          ))}
        </p>
      </div>
      <WaitlistClock />
    </div>
  );
}

export function WaitlistForm({ role, onRole }: { role: Role; onRole: (role: Role) => void }) {
  const [state, action, pending] = useActionState(joinWaitlistAction, initial);

  if (state.status === "ok") {
    return (
      <div className="releva-wait-card">
        <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{waitlistCopy.kicker}</p>
        <h2>{waitlistCopy.doneTitle}</h2>
        <p className="mt-3 text-base leading-7 text-public-muted">{waitlistCopy.doneBody}</p>
        <button type="button" className="releva-wait-submit mt-8" onClick={() => window.location.reload()}>
          {waitlistCopy.again}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="releva-wait-card">
      <h2>{waitlistCopy.formTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-public-muted">Un correo cuando abramos. Nada más.</p>
      <fieldset className="mt-5">
        <legend className="text-sm text-public-muted">Perfil</legend>
        <div className="releva-wait-roles">
          {waitlistCopy.roles.map((item) => {
            const Icon = icons[item.id];
            const selected = role === item.id;
            return (
              <label key={item.id} className={selected ? "is-on" : ""}>
                <input type="radio" name="role" value={item.id} checked={selected} onChange={() => onRole(item.id)} />
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-5 grid gap-3">
        <label className="grid gap-1.5 text-sm text-public-ink">
          {waitlistCopy.name}
          <input name="name" required minLength={2} autoComplete="name" className="releva-wait-field" />
        </label>
        <label className="grid gap-1.5 text-sm text-public-ink">
          {waitlistCopy.email}
          <input name="email" type="email" required autoComplete="email" className="releva-wait-field" placeholder="tu@correo.com" />
        </label>
        <label className="grid gap-1.5 text-sm text-public-ink">
          {waitlistCopy.city}
          <span className="sr-only">{waitlistCopy.cityHint}</span>
          <input name="city" autoComplete="address-level2" placeholder={waitlistCopy.cityHint} className="releva-wait-field" />
        </label>
      </div>
      {state.status === "error" ? <p className="mt-4 text-sm text-red-700">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="releva-wait-submit">
        {pending ? waitlistCopy.pending : waitlistCopy.submit}
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
