"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { landingCopy } from "@/lib/landing-copy";

type Step = (typeof landingCopy.home.process.timeline)[number];

const ring = { size: 168, radius: 70, stroke: 10 };
const circumference = 2 * Math.PI * ring.radius;

export function ProcessTimeline({ steps }: { steps: readonly Step[] }) {
  const copy = landingCopy.home.process;
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.4"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const dash = useTransform(progress, (value) => circumference * (1 - (reduced ? 1 : value)));
  const [amount, setAmount] = useState(reduced ? 1 : 0);

  useMotionValueEvent(progress, "change", (value) => {
    if (reduced) {
      return;
    }
    const next = Math.max(0, Math.min(1, value));
    setAmount((current) => (Math.abs(current - next) < 0.008 ? current : next));
  });

  const day = Math.round(1 + amount * 119);
  const activeIndex = steps.reduce((found, step, index) => (day >= step.day ? index : found), 0);

  return (
    <div ref={ref} className="mt-10 grid items-center gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
      <div className="flex justify-center lg:justify-start">
        <div
          className="relative flex size-[10.5rem] items-center justify-center sm:size-[11.5rem]"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={120}
          aria-valuenow={day}
          aria-label="Avance hacia el cierre en 120 días"
        >
          <svg viewBox={`0 0 ${ring.size} ${ring.size}`} className="size-full -rotate-90" aria-hidden>
            <circle
              cx={ring.size / 2}
              cy={ring.size / 2}
              r={ring.radius}
              fill="none"
              stroke="#e4eeef"
              strokeWidth={ring.stroke}
            />
            <motion.circle
              cx={ring.size / 2}
              cy={ring.size / 2}
              r={ring.radius}
              fill="none"
              stroke="#0f766e"
              strokeWidth={ring.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: reduced ? 0 : dash }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#0f766e] uppercase">{copy.dayLabel}</p>
            <p className="font-medium tabular-nums text-[3.25rem] leading-none tracking-tight text-[#1c2740]">{day}</p>
            <p className="mt-1 text-xs text-[#5c6b78]">{copy.ofLabel}</p>
          </div>
        </div>
      </div>

      <ol className="relative m-0 flex list-none flex-col gap-0 p-0">
        <span aria-hidden className="absolute top-4 bottom-4 left-[0.7rem] w-px bg-[#d7e4e6] lg:left-[0.85rem]" />
        <span
          aria-hidden
          className="absolute top-4 bottom-4 left-[0.7rem] w-px origin-top bg-[#0f766e] lg:left-[0.85rem]"
          style={{ transform: `scaleY(${reduced ? 1 : amount})` }}
        />
        {steps.map((step, index) => {
          const active = index <= activeIndex;
          const current = index === activeIndex;
          return (
            <motion.li
              key={step.day}
              className="relative flex gap-4 py-3 sm:gap-5"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : index * 0.06, ease: "easeOut" }}
            >
              <span
                className={`relative z-[1] mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold tabular-nums transition-colors duration-300 lg:size-7 ${
                  current
                    ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_0_0_6px_rgba(15,118,110,0.12)]"
                    : active
                      ? "border-[#0f766e] bg-white text-[#0f766e]"
                      : "border-[#d7e4e6] bg-white text-[#8a96a3]"
                }`}
              >
                {current && !reduced ? (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#2fc4b2] opacity-30 motion-reduce:animate-none" />
                ) : null}
                <span className="relative z-[1]">{index + 1}</span>
              </span>
              <div className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 transition-colors duration-300 sm:px-5 ${
                current ? "border-[#cfe6e3] bg-white shadow-[0_18px_40px_-28px_rgba(15,118,110,0.45)]" : "border-transparent bg-transparent"
              }`}>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0f766e] uppercase">
                  {copy.dayLabel} {step.day}
                </p>
                <h3 className="mt-1 text-lg font-medium tracking-tight text-[#1c2740] sm:text-xl">{step.title}</h3>
                <p className="mt-1 hidden text-sm leading-6 text-[#3d4a63] sm:block">{step.body}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
