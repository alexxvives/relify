import { activityItems, landingCopy } from "@/lib/landing-copy";

export function ActivityFeed() {
  const loop = [...activityItems, ...activityItems];
  const copy = landingCopy.activity;

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[24px] bg-public-moss px-5 py-10 text-white sm:rounded-[32px] sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-20 -left-16 h-72 w-80 rotate-12 rounded-[48px] bg-public-clay" />
          <div className="absolute top-28 -left-10 h-44 w-[28rem] -rotate-6 rounded-[40px] bg-public-ink/80" />
          <div className="absolute right-[38%] -bottom-16 h-56 w-64 rotate-6 rounded-[42px] bg-[#14998a]/90" />
          <div className="absolute top-10 right-[42%] h-24 w-40 -rotate-12 rounded-[28px] bg-public-clay/70" />
        </div>
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm tracking-[0.16em] text-white/75 uppercase">{copy.kicker}</p>
            <h2
              id={`${copy.id}-titulo`}
              className="releva-section-title mt-2 text-white sm:mt-3"
            >
              {copy.heading}
            </h2>
          </div>
          <div className="releva-mask-y h-[280px] overflow-hidden sm:h-[440px]">
            <div className="releva-reel-down flex flex-col gap-3">
              {loop.map((item, index) => (
                <article key={`${item.to}-${index}`} className="rounded-2xl bg-white p-4 text-public-ink shadow-sm">
                  <p className="text-xs text-public-muted">{item.time}</p>
                  <h3 className="mt-1 font-medium">{item.title}</h3>
                  <p className="text-sm text-public-muted">{item.body}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <p className="rounded-xl bg-public-sand px-2 py-2">
                      <span className="block text-public-muted">De parte</span>
                      {item.from}
                    </p>
                    <p className="rounded-xl bg-public-sand px-2 py-2">
                      <span className="block text-public-muted">Hacia</span>
                      {item.to}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
