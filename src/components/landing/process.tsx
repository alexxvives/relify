import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProcessTimeline } from "@/components/landing/process-timeline";
import { landingCopy } from "@/lib/landing-copy";

function ProcessParagraph({
  segments,
}: {
  segments: readonly { text: string; emphasis?: boolean }[];
}) {
  return (
    <p className="text-[16px] leading-7 text-[#3d4a63]">
      {segments.map((segment, index) =>
        segment.emphasis ? (
          <strong key={index} className="font-semibold text-[#1c2740]">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

export function Process() {
  const copy = landingCopy.home.process;

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-24 px-5 pt-8 pb-6 sm:px-8 sm:pt-20 sm:pb-16">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[1.5rem] border border-[#dde7ea] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7f8_100%)] p-4 text-[#1c2740] shadow-[0_30px_80px_-50px_rgba(28,39,64,0.45)] sm:rounded-[2rem] sm:p-8 lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(47,196,178,0.16),transparent_65%)]" />
        <div className="relative">
          <p className="text-sm font-semibold tracking-[0.16em] text-[#0f766e] uppercase">{copy.kicker}</p>
          <h2 id={`${copy.id}-titulo`} className="releva-section-title mt-2 max-w-[22ch] sm:mt-3 sm:max-w-none">
            <span className="block sm:inline">{copy.heading}</span>{" "}
            <span className="text-[#0f766e]">{copy.accent}</span>
          </h2>
          <p className="mt-3 text-[16px] leading-7 text-[#3d4a63] text-pretty sm:mt-4">{copy.intro}</p>
        </div>

        <ProcessTimeline steps={copy.timeline} />

        <div className="relative mt-8 flex w-full flex-col gap-4 sm:mt-10">
          {copy.bodyParagraphs.map((segments, index) => (
            <div key={index} className={index === 0 ? undefined : "hidden sm:block"}>
              <ProcessParagraph segments={segments} />
            </div>
          ))}
            <Link
            href={copy.ctaHref}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0f766e] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.8)] transition-colors hover:bg-[#1c2740] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e] sm:w-fit"
          >
            {copy.cta}
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
