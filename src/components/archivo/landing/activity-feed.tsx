import { activityItems, landingCopy } from "@/lib/landing-copy";

export function ActivityFeed() {
  const loop = [...activityItems, ...activityItems];

  return (
    <section id={landingCopy.activity.id} className="scroll-mt-24 px-4 py-8 sm:py-12">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-[#4c46b5] px-5 py-12 text-white sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-20 -left-16 h-72 w-80 rotate-12 rounded-[48px] bg-[#6d67d4]" />
          <div className="absolute top-28 -left-10 h-44 w-[28rem] -rotate-6 rounded-[40px] bg-[#3a3494]" />
          <div className="absolute right-[38%] -bottom-16 h-56 w-64 rotate-6 rounded-[42px] bg-[#7d77e4]/90" />
          <div className="absolute top-10 right-[42%] h-24 w-40 -rotate-12 rounded-[28px] bg-[#8b86ea]/70" />
        </div>
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm text-white/80">{landingCopy.activity.kicker}</p>
            <h2 className="mt-3 text-[32px] leading-[1.08] font-normal tracking-[-0.02em] sm:text-[40px]">
              {landingCopy.activity.heading}
            </h2>
          </div>
          <div className="releva-mask-y h-[440px] overflow-hidden">
            <div className="releva-reel-down flex flex-col gap-3">
              {loop.map((item, index) => (
                <article key={`${item.to}-${index}`} className="rounded-2xl bg-white p-4 text-[#2b3b4a] shadow-sm">
                  <p className="text-xs text-[#7b8792]">{item.time}</p>
                  <h3 className="mt-1 font-medium">{item.title}</h3>
                  <p className="text-sm text-[#3e4d5c]">{item.body}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <p className="rounded-xl bg-[#f4f6f8] px-2 py-2">
                      <span className="block text-[#7b8792]">De parte</span>
                      {item.from}
                    </p>
                    <p className="rounded-xl bg-[#f4f6f8] px-2 py-2">
                      <span className="block text-[#7b8792]">Hacia</span>
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
