import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = ["NDA", "Preguntas", "Reuniones", "Carta", "Cierre"];

/** Empty state for the buyer's Mis procesos: greyed cards shaped like the real process cards, plus one CTA. */
export function ProcessesPlaceholder({ cta, href = "/mercado" }: { cta: string; href?: string }) {
  return (
    <div className="relative">
      <div className="grid gap-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-[#e6e9f0]" style={{ opacity: 1 - i * 0.25 }}>
            <div className="flex items-center gap-4">
              <div className="size-12 shrink-0 rounded-xl bg-[#eef1f6]" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="h-3.5 w-40 max-w-full rounded bg-[#e6e9f0]" />
                <div className="h-2.5 w-64 max-w-full rounded bg-[#eef1f6]" />
              </div>
              <div className="hidden h-8 w-28 rounded-full bg-[#eef1f6] sm:block" />
            </div>
            <ol className="mt-5 grid grid-cols-5 gap-2">
              {steps.map((s, j) => (
                <li key={s} className="flex flex-col gap-1.5">
                  <span className={`h-1.5 rounded-full ${j === 0 && i === 0 ? "bg-[#9fd9d2]" : "bg-[#e6e9f0]"}`} />
                  <span className="h-2 w-3/4 rounded bg-[#f1f3f7]" />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Link
          href={href}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-[#465ab4] px-6 text-sm font-semibold text-white shadow-lg shadow-[#465ab4]/20 transition hover:bg-[#3a4c9c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4]"
        >
          {cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
