import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicSite } from "@/components/public-site";

export function ScenePage({
  eyebrow,
  title,
  lead,
  cta,
  children,
  close,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  cta: { href: string; label: string };
  children: ReactNode;
  close: string;
}) {
  return (
    <PublicSite>
      <main className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-public-muted">{lead}</p>
          <Link
            href={cta.href}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white hover:bg-public-clay-deep"
          >
            {cta.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <div className="mt-14 grid gap-6">{children}</div>
          <p className="mt-6 rounded-[1.6rem] bg-public-ink px-6 py-5 text-[15px] leading-6 text-white/80">{close}</p>
        </div>
      </main>
    </PublicSite>
  );
}

export function Scene({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-public-card p-5 shadow-public sm:p-8" aria-label={label}>
      <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{label}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const figures = [
  ["Facturación", "1,8 M€"],
  ["EBITDA", "420 k€"],
  ["EBITDA ajustado", "390 k€"],
] as const;

export function MiniFicha({
  name = "Proyecto Alba",
  region = "Valencia",
  price = "2,4 M€",
  open = false,
}: {
  name?: string;
  region?: string;
  price?: string;
  open?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-public-line bg-white">
      <div className="relative h-36">
        <Image src="/hero/city-lit.png" alt="" fill className="object-cover object-[center_42%]" sizes="360px" />
        {open ? <span className="absolute top-3 left-3 rounded-full bg-public-clay px-3 py-1 text-xs text-white">Abierto</span> : null}
      </div>
      <div className="border-b border-public-line px-4 py-3">
        <p className="text-lg font-medium tracking-tight">{name}</p>
        <p className="text-sm text-public-muted">{region}</p>
      </div>
      <p className="px-4 py-3 text-2xl tracking-tight">{price}</p>
      <dl className="grid grid-cols-3 border-t border-public-line">
        {figures.map(([label, value]) => (
          <div key={label} className="px-3 py-3">
            <dt className="text-[10px] tracking-wide text-public-muted uppercase">{label}</dt>
            <dd className="mt-1 text-sm tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function Trio({ items }: { items: readonly { title: string; body: string; live?: boolean }[] }) {
  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.title} className={`rounded-[1.4rem] px-5 py-6 ${item.live ? "bg-public-ink text-white" : "bg-[#f4f1ea]"}`}>
          <p className={`text-xs tracking-[0.14em] uppercase ${item.live ? "text-white/50" : "text-public-muted"}`}>{String(index + 1).padStart(2, "0")}</p>
          <p className="mt-3 text-xl tracking-tight">{item.title}</p>
          <p className={`mt-2 text-sm leading-6 ${item.live ? "text-white/70" : "text-public-muted"}`}>{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
