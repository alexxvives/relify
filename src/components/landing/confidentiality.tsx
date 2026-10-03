import { landingCopy } from "@/lib/landing-copy";

export function Confidentiality() {
  const copy = landingCopy.confidentiality;

  return (
    <section id={copy.id} className="scroll-mt-28 px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="max-w-3xl text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">{copy.heading}</h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-public-muted">{copy.intro}</p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="flex flex-col rounded-[2rem] bg-public-card p-6 shadow-public">
            <div className="releva-float rounded-3xl bg-public-sand p-4">
              <div className="space-y-2" aria-hidden="true">
                <div className="h-2 w-2/3 rounded-full bg-public-line" />
                <div className="h-2 w-full rounded-full bg-public-card" />
                <div className="h-2 w-5/6 rounded-full bg-public-card" />
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm text-public-muted">
                <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-public-clay text-[10px] text-white">
                  ✓
                </span>
                He leído cómo se trata la ficha pública
              </p>
              <span className="mt-3 flex h-10 items-center justify-center rounded-full bg-public-ink text-sm text-white">
                Estoy conforme
              </span>
            </div>
            <h3 className="mt-5 text-lg font-medium">{copy.privacyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-public-muted">{copy.privacyBody}</p>
          </article>
          <article className="flex flex-col rounded-[2rem] bg-public-card p-6 shadow-public">
            <div className="releva-toast rounded-3xl bg-public-sand p-4">
              <p className="text-xs text-public-muted">Hoy · 10:41</p>
              <p className="mt-1 font-medium">{copy.toastTitle}</p>
              <p className="text-sm text-public-muted">{copy.toastBody}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <p className="rounded-2xl bg-public-card px-2 py-2">
                  <span className="block text-public-muted">Inversor</span>
                  Industrial 1842
                </p>
                <p className="rounded-2xl bg-public-card px-2 py-2">
                  <span className="block text-public-muted">Empresa</span>
                  Proyecto Alba
                </p>
              </div>
            </div>
            <h3 className="mt-5 text-lg font-medium">{copy.namesTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-public-muted">{copy.namesBody}</p>
          </article>
          <article className="flex flex-col rounded-[2rem] bg-public-card p-6 shadow-public">
            <div className="releva-float-late rounded-3xl bg-public-sand p-4">
              <p className="text-sm">{copy.ndaFile}</p>
              <div className="mt-3 space-y-2" aria-hidden="true">
                <div className="h-2 w-full rounded-full bg-public-card" />
                <div className="h-2 w-4/5 rounded-full bg-public-card" />
              </div>
              <span className="mt-4 flex h-10 items-center justify-center rounded-full bg-public-clay text-sm text-white">
                {copy.ndaAction}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-medium">{copy.ndaTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-public-muted">{copy.ndaBody}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
