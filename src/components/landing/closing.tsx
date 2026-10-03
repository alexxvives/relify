import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy, logoMarks, storyCards } from "@/lib/landing-copy";

export function Closing() {
  const marks = [...logoMarks, ...logoMarks];

  return (
    <>
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm text-public-muted">Historias</p>
              <h2 className="mt-3 text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">{landingCopy.stories.heading}</h2>
              <p className="mt-4 text-[16px] leading-7 text-public-muted">{landingCopy.stories.intro}</p>
            </div>
            <Link
              href="/recursos/casos"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-public-clay px-5 text-sm text-white hover:bg-public-clay-deep"
            >
              {landingCopy.stories.more}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {storyCards.map((card, index) => (
              <li key={card.href}>
                <Link href={card.href} className="flex h-full flex-col rounded-[2rem] bg-public-card p-6 shadow-public">
                  <span className="text-sm text-public-muted">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-4 text-xs tracking-[0.16em] text-public-muted uppercase">{card.kicker}</span>
                  <span className="mt-2 text-2xl leading-tight font-medium">{card.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id={landingCopy.mission.id} className="scroll-mt-28 px-5 pb-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-public-card px-8 py-12 shadow-public sm:px-12">
          <p className="text-sm text-public-muted">{landingCopy.mission.eyebrow}</p>
          <h2 className="mt-4 max-w-4xl text-3xl leading-[1.15] font-medium tracking-tight sm:text-4xl">{landingCopy.mission.heading}</h2>
          <Link
            href="/sobre"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-public-clay px-5 text-sm text-white hover:bg-public-clay-deep"
          >
            {landingCopy.mission.more}
          </Link>
        </div>
      </section>
      <section className="px-5 py-16" aria-label={landingCopy.logosHeading}>
        <h2 className="mx-auto max-w-5xl text-3xl font-medium tracking-tight">{landingCopy.logosHeading}</h2>
        <div className="releva-mask-x mt-8 overflow-hidden">
          <div className="releva-marquee flex w-max items-center gap-14 pr-14">
            {marks.map((mark, index) => (
              <span
                key={`${mark.name}-${index}`}
                className="inline-flex items-center gap-2 text-[22px] font-medium tracking-tight text-public-muted"
                aria-hidden={index >= logoMarks.length}
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-public-card text-[12px] text-public-ink">
                  {mark.name.slice(0, 1)}
                </span>
                {mark.word}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
