import { landingCopy } from "@/lib/landing-copy";

export function Confidentiality() {
  const copy = landingCopy.confidentiality;

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-[1440px]">
        <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{copy.kicker}</p>
        <h2 id={`${copy.id}-titulo`} className="mt-3 max-w-3xl text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">
          {copy.heading}
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-public-muted">{copy.intro}</p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="flex flex-col rounded-[24px] bg-public-sand p-4">
            <div className="releva-float rounded-2xl bg-white p-4 shadow-sm">
              <div className="space-y-2" aria-hidden="true">
                <div className="h-2 w-2/3 rounded-full bg-public-line" />
                <div className="h-2 w-full rounded-full bg-public-sand" />
                <div className="h-2 w-5/6 rounded-full bg-public-sand" />
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm text-public-muted">
                <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border border-public-clay bg-public-clay text-[10px] text-white">
                  ✓
                </span>
                He leído cómo se trata la ficha pública
              </p>
              <span className="mt-3 flex h-10 items-center justify-center rounded-xl bg-public-ink text-sm text-white">
                Estoy conforme
              </span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-public-ink">{copy.privacyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-public-muted">{copy.privacyBody}</p>
          </article>
          <article className="flex flex-col rounded-[24px] bg-public-sand p-4">
            <div className="releva-toast rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-public-muted">Hoy · 10:41</p>
              <p className="mt-1 font-medium text-public-ink">{copy.toastTitle}</p>
              <p className="text-sm text-public-muted">{copy.toastBody}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <p className="rounded-xl bg-public-sand px-2 py-2 text-public-ink">
                  <span className="block text-public-muted">Inversor</span>
                  Industrial 1842
                </p>
                <p className="rounded-xl bg-public-sand px-2 py-2 text-public-ink">
                  <span className="block text-public-muted">Empresa</span>
                  Proyecto Alba
                </p>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-public-ink">{copy.namesTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-public-muted">{copy.namesBody}</p>
          </article>
          <article className="flex flex-col rounded-[24px] bg-public-sand p-4">
            <div className="releva-float-late rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-public-ink">{copy.ndaFile}</p>
              <div className="mt-3 space-y-2" aria-hidden="true">
                <div className="h-2 w-full rounded-full bg-public-sand" />
                <div className="h-2 w-4/5 rounded-full bg-public-sand" />
              </div>
              <span className="mt-4 flex h-10 items-center justify-center rounded-xl bg-public-clay text-sm text-white">
                {copy.ndaAction}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-public-ink">{copy.ndaTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-public-muted">{copy.ndaBody}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
