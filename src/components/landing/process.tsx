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
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-28 px-5 pt-16 pb-12 sm:px-8 sm:pt-20 sm:pb-16">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[2rem] border border-[#dde7ea] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7f8_100%)] p-5 text-[#1c2740] shadow-[0_30px_80px_-50px_rgba(28,39,64,0.45)] sm:p-8 lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(47,196,178,0.16),transparent_65%)]" />
        <div className="relative">
          <p className="text-sm font-semibold tracking-[0.16em] text-[#0f766e] uppercase">{copy.kicker}</p>
          <h2 id={`${copy.id}-titulo`} className="mt-3 max-w-[22ch] text-4xl leading-[1.02] font-medium tracking-tight sm:max-w-none sm:text-6xl">
            <span className="block sm:inline">{copy.heading}</span>{" "}
            <span className="text-[#0f766e] whitespace-nowrap">{copy.accent}</span>
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-[#3d4a63] text-pretty">{copy.intro}</p>
        </div>

        <ProcessTimeline steps={copy.timeline} />

        <div className="relative mt-10 flex w-full flex-col gap-4">
          {copy.bodyParagraphs.map((segments, index) => (
            <ProcessParagraph key={index} segments={segments} />
          ))}
          <Link
            href="/empresas"
            className="mt-2 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-[#0f766e] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.8)] transition-colors hover:bg-[#1c2740] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
          >
            {copy.cta}
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
