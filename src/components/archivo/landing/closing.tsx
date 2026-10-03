import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy, logoMarks, storyCards } from "@/lib/landing-copy";

export function Closing() {
  const marks = [...logoMarks, ...logoMarks];

  return (
    <>
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.14em] text-[#465ab4] uppercase">Historias</p>
              <h2 className="mt-3 text-[32px] leading-[1.05] font-normal tracking-[-0.02em] sm:text-[40px]">{landingCopy.stories.heading}</h2>
              <p className="mt-3 text-[15px] text-[#5c6b78]">{landingCopy.stories.intro}</p>
            </div>
            <Link href="/recursos/casos" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#eef1f4] px-4 text-sm">
              {landingCopy.stories.more}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {storyCards.map((card) => (
              <Link key={card.href} href={card.href} className="group rounded-[24px] bg-[#f4f6f8] p-6 transition hover:-translate-y-1 hover:bg-[#eef1fb]">
                <p className="text-xs font-medium tracking-[0.14em] text-[#465ab4] uppercase">{card.kicker}</p>
                <h3 className="mt-3 text-2xl leading-tight font-normal tracking-[-0.02em]">{card.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section id={landingCopy.mission.id} className="scroll-mt-24 px-4 pb-16">
        <div className="mx-auto max-w-[1100px] rounded-[32px] bg-[radial-gradient(120%_120%_at_20%_0%,#dae2ff,#f7f4ee_55%,#f3d7b0)] px-6 py-14 sm:px-12">
          <p className="text-xs font-medium tracking-[0.14em] text-[#465ab4] uppercase">{landingCopy.mission.eyebrow}</p>
          <h2 className="mt-4 max-w-4xl text-[28px] leading-[1.15] font-normal tracking-[-0.02em] sm:text-[40px]">
            {landingCopy.mission.heading}
          </h2>
          <Link href="/sobre" className="mt-8 inline-flex h-12 items-center rounded-2xl bg-[#465ab4] px-5 text-sm text-white">
            {landingCopy.mission.more}
          </Link>
        </div>
      </section>
      <section className="px-4 pb-16" aria-label={landingCopy.logosHeading}>
        <h2 className="mx-auto max-w-[1200px] text-center text-[32px] font-normal tracking-[-0.02em]">{landingCopy.logosHeading}</h2>
        <div className="releva-mask-x mt-8 overflow-hidden">
          <div className="releva-marquee flex w-max items-center gap-14 pr-14">
            {marks.map((mark, index) => (
              <span
                key={`${mark.name}-${index}`}
                className="inline-flex items-center gap-2 text-[22px] tracking-[-0.03em] text-[#9aa6b2]"
                aria-hidden={index >= logoMarks.length}
              >
                <span className="inline-flex size-7 items-center justify-center rounded-md border border-[#d5dbe3] text-[11px] font-semibold text-[#7b8792]">
                  {mark.name.slice(0, 1)}
                </span>
                <span className={index % 2 === 0 ? "font-semibold tracking-[0.14em]" : "font-serif italic"}>{mark.word}</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
