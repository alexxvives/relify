import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicSite } from "@/components/public-site";

export type AudienceStep = { title: string; body: string };

export function AudiencePage({
  eyebrow,
  title,
  lead,
  steps,
  note,
  cta,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  steps: readonly AudienceStep[];
  note: string;
  cta: { href: string; label: string };
}) {
  return (
    <PublicSite>
      <main className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid w-full max-w-[1440px] items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{eyebrow}</p>
            <h1 className="mt-3 max-w-xl text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">{title}</h1>
            <p className="mt-5 max-w-lg text-[16px] leading-7 text-public-muted">{lead}</p>
            <Link
              href={cta.href}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white hover:bg-public-clay-deep"
            >
              {cta.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ol className="grid gap-3">
            {steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[auto_1fr] gap-4 rounded-[1.6rem] bg-public-card p-5 shadow-public sm:p-6">
                <span className="grid size-11 place-items-center rounded-full bg-public-ink text-sm text-white">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-lg font-medium">{step.title}</span>
                  <span className="mt-1 block text-[15px] leading-6 text-public-muted">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[1440px] rounded-[1.6rem] bg-public-ink px-6 py-5 text-[15px] leading-6 text-white/80">{note}</p>
      </main>
    </PublicSite>
  );
}
