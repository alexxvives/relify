import { landingCopy } from "@/lib/landing-copy";

type Step = (typeof landingCopy.home.process.timeline)[number];

export function ProcessTimeline({ steps }: { steps: readonly Step[] }) {
  const copy = landingCopy.home.process;

  return (
    <ol className="releva-process-steps mt-6 sm:mt-10">
      {steps.map((step) => (
        <li key={step.n} className="releva-process-step">
          <span className="releva-process-num">{step.n}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0f766e] uppercase">
              {copy.stepLabel} {step.n}
            </p>
            <h3 className="mt-0.5 text-base font-medium tracking-tight text-[#1c2740] sm:text-xl">{step.title}</h3>
            <p className="mt-1 hidden text-sm leading-6 text-[#3d4a63] sm:block">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
