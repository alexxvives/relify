"use client";

import { useEffect, useRef, useState } from "react";
import { landingCopy, type FlowRole } from "@/lib/landing-copy";

type Track = (typeof landingCopy.home.flow.tracks)[FlowRole];
type FlowStep = Track["steps"][number];
type FormPanel = Extract<FlowStep["panel"], { kind: "form" }>;
type CifPanel = Extract<FlowStep["panel"], { kind: "cif" }>;
type TaskPanel = Extract<FlowStep["panel"], { kind: "tasks" }>;
type LivePanel = Extract<FlowStep["panel"], { kind: "live" }>;

function prefersStill() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useDelays(delays: readonly number[], play: boolean) {
  const key = delays.join(",");
  const [flags, setFlags] = useState<boolean[]>(() => delays.map(() => false));

  useEffect(() => {
    const parsed = key.length === 0 ? [] : key.split(",").map((part) => Number(part));
    if (!play) {
      return;
    }
    const timers = parsed.map((delay, index) =>
      window.setTimeout(
        () => {
          setFlags((current) => {
            const next = current.slice();
            next[index] = true;
            return next;
          });
        },
        prefersStill() ? 0 : delay,
      ),
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [key, play]);

  return flags;
}

function useTyped(text: string, startAt: number, play: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!play) {
      return;
    }
    let timer = 0;
    let next = 0;
    const tick = () => {
      if (prefersStill()) {
        setCount(text.length);
        return;
      }
      next += 1;
      setCount(next);
      if (next < text.length) {
        timer = window.setTimeout(tick, 1000 / 15);
      }
    };
    const start = window.setTimeout(tick, prefersStill() ? 0 : startAt);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timer);
    };
  }, [play, startAt, text]);

  return { shown: text.slice(0, count), done: count >= text.length };
}

function useCount(target: number, startAt: number, play: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!play) {
      return;
    }
    if (prefersStill()) {
      const timer = window.setTimeout(() => setValue(target), 0);
      return () => window.clearTimeout(timer);
    }
    let frame = 0;
    const duration = 1100;
    let started = 0;
    const step = (now: number) => {
      if (started === 0) {
        started = now;
      }
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };
    const timer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(step);
    }, startAt);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [play, startAt, target]);

  return value;
}

export function HowItWorks({ role, travel = 0 }: { role: FlowRole; travel?: number }) {
  const copy = landingCopy.home.flow;
  const track = copy.tracks[role];
  const [active, setActive] = useState(0);
  const current = track.steps[active] ?? track.steps[0];

  useEffect(() => {
    if (typeof window === "undefined" || prefersStill()) {
      return;
    }
    const dwell = 5600;
    const timers = track.steps.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setActive(index + 1);
      }, dwell * (index + 1)),
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [track.steps]);

  if (!current) {
    return null;
  }

  return (
    <div id={copy.id} className="mt-8 sm:mt-12">
      <ol className="releva-how-mobile mt-5 lg:hidden">
        {track.steps.map((step) => (
          <li key={step.n} className="releva-how-mobile-card">
            <span className="text-[11px] font-semibold tracking-[0.16em] text-public-clay uppercase">Paso {step.n}</span>
            <h3 className="mt-1 text-base font-medium tracking-tight text-public-ink">{step.title}</h3>
            <p className="mt-1 text-sm leading-5 text-public-muted">{step.body}</p>
            <InlinePanel step={step} />
          </li>
        ))}
      </ol>

      <div className="releva-how-grid mt-8 hidden lg:grid">
        <ol className={`releva-how-steps${travel > 0 ? " releva-how-travel" : ""}`}>
          {track.steps.map((step, index) => (
            <li
              key={step.n}
              className={`releva-how-step${index === active ? " releva-how-on" : ""}${index < active ? " releva-how-done" : ""}`}
            >
              <button type="button" className="contents" onClick={() => setActive(index)}>
                <span className="releva-how-rail" aria-hidden="true">
                  <span className="releva-how-rail-light" />
                  <span className="releva-how-dot" />
                </span>
                <div className="releva-how-copy">
                  <span className="releva-how-num">Paso {step.n}</span>
                  <h3 className="releva-how-title">{step.title}</h3>
                  <p className="releva-how-body">{step.body}</p>
                </div>
              </button>
            </li>
          ))}
        </ol>
        <div className="releva-how-visual" aria-hidden="true">
          <FadingPanel step={current} token={`${role}-${current.n}-${travel}`} />
        </div>
      </div>
    </div>
  );
}

function InlinePanel({ step }: { step: FlowStep }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setPlay(true);
        }
      },
      { rootMargin: "-20% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="releva-how-inline" aria-hidden="true">
      <FlowCard step={step} play={play} enter />
    </div>
  );
}

function FadingPanel({ step, token }: { step: FlowStep; token: string }) {
  const [slots, setSlots] = useState<Array<{ token: string; step: FlowStep; on: boolean }>>([{ token, step, on: true }]);
  const [shown, setShown] = useState<Record<string, true>>({ [token]: true });
  const activeToken = useRef(token);

  useEffect(() => {
    if (activeToken.current === token) {
      return;
    }
    let reveal = 0;
    const show = window.setTimeout(() => {
      activeToken.current = token;
      setSlots((current) => {
        const active = current.find((slot) => slot.on);
        if (!active || active.token === token) {
          return current;
        }
        return [
          { token: active.token, step: active.step, on: false },
          { token, step, on: true },
        ];
      });
      setShown((current) => {
        if (current[token] !== true) {
          return current;
        }
        const next = { ...current };
        delete next[token];
        return next;
      });
      reveal = window.requestAnimationFrame(() => {
        setShown((current) => ({ ...current, [token]: true }));
      });
    }, 0);
    const drop = window.setTimeout(() => {
      setSlots((current) => current.filter((slot) => slot.on));
    }, 780);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(drop);
      if (reveal !== 0) {
        window.cancelAnimationFrame(reveal);
      }
    };
  }, [step, token]);

  return (
    <div className="releva-hv-stage">
      {slots.map((slot) => {
        const arriving = slot.on && shown[slot.token] !== true;
        const className = !slot.on ? "releva-hv-layer releva-hv-layer-out" : arriving ? "releva-hv-layer releva-hv-from" : "releva-hv-layer";
        return (
          <div key={slot.token} className={className}>
            <FlowCard step={slot.step} play />
          </div>
        );
      })}
    </div>
  );
}

function FlowCard({ step, play, enter = false }: { step: FlowStep; play: boolean; enter?: boolean }) {
  if (step.panel.kind === "cif") {
    return (
      <div className={enter ? "releva-hv-card releva-hv-enter" : "releva-hv-card"}>
        <CifBody panel={step.panel} play={play} />
      </div>
    );
  }

  return (
    <div className={enter ? "releva-hv-card releva-hv-enter" : "releva-hv-card"}>
      <div className="releva-hv-head">
        <span className="releva-hv-mark" aria-hidden="true">
          R
        </span>
        <span className="releva-hv-head-title">{step.cardTitle}</span>
        <span className="releva-hv-chip">{step.chip}</span>
      </div>
      {step.panel.kind === "form" ? <FormBody panel={step.panel} play={play} /> : null}
      {step.panel.kind === "tasks" ? <TaskBody panel={step.panel} play={play} /> : null}
      {step.panel.kind === "live" ? <LiveBody panel={step.panel} play={play} /> : null}
    </div>
  );
}

function CifBody({ panel, play }: { panel: CifPanel; play: boolean }) {
  const typed = useTyped(panel.text, 280, play);
  const beats = useDelays([280, 1180, 1700], play && typed.done);
  const phase = beats[2] === true ? "charts" : beats[1] === true ? "ok" : beats[0] === true ? "load" : "type";

  const pie = panel.pie;
  const pieTotal = pie.reduce((sum, slice) => sum + slice.value, 0);
  const pieStops = pie.reduce<{ stops: string[]; cursor: number }>(
    (acc, slice) => {
      const next = acc.cursor + (slice.value / pieTotal) * 100;
      return { stops: [...acc.stops, `${slice.color} ${acc.cursor}% ${next}%`], cursor: next };
    },
    { stops: [], cursor: 0 },
  ).stops;
  const barPeak = Math.max(...panel.bars.values, 1);
  const linePeak = Math.max(...panel.line.values, 1);
  const linePoints = panel.line.values.map((value, index) => {
    const x = 8 + (index / Math.max(panel.line.values.length - 1, 1)) * 112;
    const y = 52 - (value / linePeak) * 40;
    return `${x},${y}`;
  });
  const linePath = `M ${linePoints.join(" L ")}`;
  const areaPath = `${linePath} L 120,56 L 8,56 Z`;

  if (phase !== "charts") {
    return (
      <div className="releva-cif-stage">
        <div className="releva-cif-popup">
          <p className="releva-cif-kicker">{panel.label}</p>
          {phase === "load" ? (
            <div className="releva-cif-load">
              <span className="releva-cif-spin" aria-hidden="true" />
              {panel.loading}
            </div>
          ) : (
            <>
              <span className="releva-cif-field" data-ok={phase === "ok" ? "true" : undefined}>
                <span>{typed.shown}</span>
                {phase === "ok" ? (
                  <span className="releva-cif-ok" aria-hidden="true">
                    <Tick />
                  </span>
                ) : (
                  <span className={typed.done ? "releva-hv-caret" : "releva-hv-caret releva-hv-caret-blink"} />
                )}
              </span>
              {phase === "type" ? (
                <button type="button" className="releva-cif-go" disabled={!typed.done}>
                  {panel.submit}
                </button>
              ) : (
                <p className="mt-3 text-center text-xs font-medium text-[#17663a]">{panel.ready}</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="releva-cif-stage">
      <div className="releva-cif-board">
        <div className="releva-cif-head">
          <strong>{panel.company}</strong>
          <span>{panel.meta}</span>
        </div>
        <div className="releva-cif-charts">
          <div className="releva-cif-card releva-cif-donut">
            <p>Mix de clientes</p>
            <span
              className="relative size-24 rounded-full"
              style={{ background: `conic-gradient(${pieStops.join(", ")})` }}
              aria-hidden
            >
              <span className="absolute inset-4 rounded-full bg-white" />
            </span>
          </div>
          <div className="releva-cif-card">
            <p>
              {panel.bars.label} · {panel.bars.unit}
            </p>
            <span className="releva-cif-bars">
              {panel.bars.values.map((value, index) => (
                <i
                  key={`${panel.bars.label}-${index}`}
                  style={{
                    height: `${Math.max(14, Math.round((value / barPeak) * 100))}%`,
                    background: panel.bars.colors[index] ?? "#2fc4b2",
                    animationDelay: `${0.08 + index * 0.08}s`,
                  }}
                />
              ))}
            </span>
          </div>
        </div>
        <div className="releva-cif-card">
          <p>
            {panel.line.label} · {panel.line.unit}
          </p>
          <svg className="releva-cif-line" viewBox="0 0 128 56" aria-hidden>
            <defs>
              <linearGradient id="releva-cif-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2fc4b2" />
                <stop offset="100%" stopColor="#2fc4b2" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="fill" d={areaPath} />
            <path d={linePath} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function FormBody({ panel, play }: { panel: FormPanel; play: boolean }) {
  const choiceDelays = panel.fields.map((field) => (field.kind === "choice" ? field.pickAt : -1)).filter((delay) => delay >= 0);
  const picks = useDelays(choiceDelays, play);
  const typedField = panel.fields.find((field) => field.kind === "type");
  const typed = useTyped(
    typedField?.kind === "type" ? typedField.text : "",
    typedField?.kind === "type" ? typedField.startAt : 0,
    play && typedField?.kind === "type",
  );
  const done = picks.filter(Boolean).length + (typed.done ? 1 : 0);
  const width = Math.min(100, 8 + 18 * done);

  const typeField = panel.fields.find((field) => field.kind === "type");
  const choiceFields = panel.fields.filter((field) => field.kind === "choice");

  return (
    <div className="releva-hv-body">
      {typeField ? (
        <div className="releva-hv-row releva-hv-field" style={{ animationDelay: "0.06s" }}>
          <span className="releva-hv-label">{typeField.label}</span>
          <span className="releva-hv-input">
            {typed.shown}
            <span className={typed.done ? "releva-hv-caret" : "releva-hv-caret releva-hv-caret-blink"} />
          </span>
        </div>
      ) : null}
      {choiceFields.map((field, index) => {
        const picked = picks[index] === true;
        return (
          <div key={field.label} className="releva-hv-row releva-hv-field" style={{ animationDelay: `${0.06 + index * 0.07}s` }}>
            <span className="releva-hv-label">{field.label}</span>
            <span className="releva-hv-opts">
              {field.options.map((option, optionIndex) => {
                const on = picked && optionIndex === 0;
                return (
                  <span key={option} className={on ? "releva-hv-opt releva-hv-opt-on" : "releva-hv-opt"}>
                    {on ? (
                      <span className="releva-hv-tick">
                        <Tick />
                      </span>
                    ) : null}
                    {option}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
      <div className="releva-hv-row releva-hv-foot" style={{ animationDelay: `${0.06 + panel.fields.length * 0.07}s` }}>
        <span className="releva-hv-progress" aria-hidden="true">
          <span className="releva-hv-progress-fill" style={{ width: `${width}%` }} />
        </span>
        <span className="releva-hv-note">{panel.foot}</span>
      </div>
    </div>
  );
}

function TaskBody({ panel, play }: { panel: TaskPanel; play: boolean }) {
  const flags = useDelays(
    panel.rows.map((_, index) => 650 + 430 * index),
    play,
  );
  const stampAt = 650 + 430 * panel.rows.length + 280;
  const foot = useDelays([stampAt + 200], play)[0] === true;
  const stamped = useDelays([stampAt], play)[0] === true;
  const stamp = "stamp" in panel ? panel.stamp : undefined;

  return (
    <div className="releva-hv-body">
      {panel.rows.map((row, index) => {
        const done = flags[index] === true;
        return (
          <div key={row.name} className="releva-hv-row releva-hv-task" style={{ animationDelay: `${0.06 + index * 0.07}s` }}>
            <span className="releva-hv-task-name">{row.name}</span>
            {done ? (
              <span className="releva-hv-state">
                <Tick />
                {row.done}
              </span>
            ) : (
              <span className="releva-hv-state releva-hv-state-pending">
                <span className="releva-hv-spinner" aria-hidden="true" />
                {row.pending}
              </span>
            )}
          </div>
        );
      })}
      {stamp ? <span className={stamped ? "releva-hv-stamp releva-hv-stamp-on" : "releva-hv-stamp"}>{stamp}</span> : null}
      <div className={foot ? "releva-hv-foot releva-hv-foot-in" : "releva-hv-foot"}>
        <span className="releva-hv-strong">{panel.strong}</span>
        <span className="releva-hv-note">{panel.note}</span>
      </div>
    </div>
  );
}

function LiveBody({ panel, play }: { panel: LivePanel; play: boolean }) {
  const week = landingCopy.home.flow.week;
  const dayDelays = week.map((_, index) => {
    const order = panel.daysOn.findIndex((day) => day === index);
    return order >= 0 ? 700 + order * 200 : 0;
  });
  const dayFlags = useDelays(dayDelays, play);
  const count = useCount(panel.count.target, 1900, play);
  const foot = useDelays([3200], play)[0] === true;
  const countLabel = `${Math.round(count)}${panel.count.suffix}`;

  return (
    <div className="releva-hv-body">
      <div className="releva-hv-row releva-hv-person" style={{ animationDelay: "0.06s" }}>
        <span className="releva-hv-avatar" aria-hidden="true">
          {panel.who.slice(0, 1)}
        </span>
        <span className="releva-hv-person-copy">
          <span className="releva-hv-person-name">{panel.who}</span>
          <span className="releva-hv-person-role">{panel.detail}</span>
        </span>
        <span className="releva-hv-state releva-hv-state-live">{panel.status}</span>
      </div>
      <div className="releva-hv-row releva-hv-week" style={{ animationDelay: "0.13s" }}>
        {week.map((day, index) => {
          const on = panel.daysOn.some((day) => day === index) && dayFlags[index] === true;
          return (
            <span key={`${day}-${index}`} className={on ? "releva-hv-day releva-hv-day-on" : "releva-hv-day"}>
              {day}
            </span>
          );
        })}
      </div>
      {panel.rows.map((row, index) => (
        <div key={row.name} className="releva-hv-row releva-hv-task" style={{ animationDelay: `${0.2 + index * 0.07}s` }}>
          <span className="releva-hv-task-name">{row.name}</span>
          <span className="releva-hv-task-value">{row.value}</span>
        </div>
      ))}
      <div className="releva-hv-row releva-hv-task" style={{ animationDelay: `${0.2 + panel.rows.length * 0.07}s` }}>
        <span className="releva-hv-task-name">{panel.count.name}</span>
        <span className="releva-hv-task-value releva-hv-num">{countLabel}</span>
      </div>
      <div className={foot ? "releva-hv-foot releva-hv-foot-in" : "releva-hv-foot"}>
        <span className="releva-hv-strong">{panel.strong}</span>
        <span className="releva-hv-note">{panel.note}</span>
      </div>
    </div>
  );
}

function Tick() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path d="M1 5.2L4.4 8.6L11 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
