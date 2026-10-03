import { activityItems, landingCopy } from "@/lib/landing-copy";

export function ActivityFeed() {
  const loop = [...activityItems, ...activityItems];

  return (
    <section id={landingCopy.activity.id} className="scroll-mt-28 px-5 py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm text-public-muted">{landingCopy.activity.kicker}</p>
          <h2 className="mt-4 text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">{landingCopy.activity.heading}</h2>
        </div>
        <div className="releva-mask-y h-[440px] overflow-hidden">
          <div className="releva-reel-down flex flex-col gap-3">
            {loop.map((item, index) => (
              <article key={`${item.to}-${index}`} className="rounded-3xl bg-public-card p-4 shadow-public">
                <p className="text-xs text-public-muted">{item.time}</p>
                <h3 className="mt-1 font-medium">{item.title}</h3>
                <p className="text-sm text-public-muted">{item.body}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <p className="rounded-2xl bg-public-sand px-2 py-2">
                    <span className="block text-public-muted">De parte</span>
                    {item.from}
                  </p>
                  <p className="rounded-2xl bg-public-sand px-2 py-2">
                    <span className="block text-public-muted">Hacia</span>
                    {item.to}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
