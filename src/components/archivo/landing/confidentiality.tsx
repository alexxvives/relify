import { landingCopy } from "@/lib/landing-copy";

export function Confidentiality() {
  const copy = landingCopy.confidentiality;

  return (
    <section id={copy.id} className="scroll-mt-24 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="max-w-3xl text-[32px] leading-[1.05] font-normal tracking-[-0.02em] sm:text-[40px]">{copy.heading}</h2>
        <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[#3e4d5c]">{copy.intro}</p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="flex flex-col rounded-[24px] bg-[#f3f5fb] p-4">
            <div className="releva-float rounded-2xl bg-white p-4 shadow-sm">
              <div className="space-y-2" aria-hidden="true">
                <div className="h-2 w-2/3 rounded-full bg-[#e6ebf2]" />
                <div className="h-2 w-full rounded-full bg-[#eef1f4]" />
                <div className="h-2 w-5/6 rounded-full bg-[#eef1f4]" />
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm text-[#3e4d5c]">
                <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border border-[#465ab4] bg-[#465ab4] text-[10px] text-white">
                  ✓
                </span>
                He leído cómo se trata la ficha pública
              </p>
              <span className="mt-3 flex h-10 items-center justify-center rounded-xl bg-[#2b3b4a] text-sm text-white">Estoy conforme</span>
            </div>
            <h3 className="mt-4 text-lg font-medium">{copy.privacyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-[#3e4d5c]">{copy.privacyBody}</p>
          </article>
          <article className="flex flex-col rounded-[24px] bg-[#f3f5fb] p-4">
            <div className="releva-toast rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-[#7b8792]">Hoy · 10:41</p>
              <p className="mt-1 font-medium">{copy.toastTitle}</p>
              <p className="text-sm text-[#3e4d5c]">{copy.toastBody}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <p className="rounded-xl bg-[#f4f6f8] px-2 py-2">
                  <span className="block text-[#7b8792]">Comprador</span>
                  Industrial 1842
                </p>
                <p className="rounded-xl bg-[#f4f6f8] px-2 py-2">
                  <span className="block text-[#7b8792]">Empresa</span>
                  Proyecto Alba
                </p>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium">{copy.namesTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-[#3e4d5c]">{copy.namesBody}</p>
          </article>
          <article className="flex flex-col rounded-[24px] bg-[#f3f5fb] p-4">
            <div className="releva-float-late rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-medium">{copy.ndaFile}</p>
              <div className="mt-3 space-y-2" aria-hidden="true">
                <div className="h-2 w-full rounded-full bg-[#eef1f4]" />
                <div className="h-2 w-4/5 rounded-full bg-[#eef1f4]" />
              </div>
              <span className="mt-4 flex h-10 items-center justify-center rounded-xl bg-[#465ab4] text-sm text-white">{copy.ndaAction}</span>
            </div>
            <h3 className="mt-4 text-lg font-medium">{copy.ndaTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-[#3e4d5c]">{copy.ndaBody}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
