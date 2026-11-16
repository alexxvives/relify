"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Check, Upload as UpIcon } from "lucide-react";
import { sellerCopy } from "@/lib/seller-copy";
import "./upload-dropzone.css";

/* Upload dropzone from Bencho (MIT). https://bencho.dev/licence
   Relify wires it to real desktop files and the data-room upload action. */

/* ══ Upload dropzone ══════════════════════════════════════
   A drop box, and three files lying on a tray under it. Pick
   one up and carry it into the box: it uploads there — name,
   a rolling percentage, a bar — ticks, and goes back to the
   tray so you can do it again.

   ── NO REAL FILES ───────────────────────────────────────
   The files are part of the block. Nothing is read from the
   desktop and nothing is sent anywhere; the drag is an ordinary
   pointer drag inside the block, which is also what lets the
   wall's scripted cursor demonstrate it.

   Relify: the tray and snark are gone. Drop or click picks real
   files from the desktop and sends them through onUpload.

   ── THE BOX INHALES, AND SWALLOWS ───────────────────────
   A plain filled box, no edge. A file carried over it is
   answered before it is let go: the box grows with a small
   bounce and the arrow lifts toward the hand. Let go and the
   file is SUCKED in — it accelerates toward the box's middle,
   shrinking and drawing out long as it goes — and the box gives
   a little gulp before the upload appears in it. Let go
   anywhere else and the file springs home.

   ── ONE OF THEM IS TOO BIG ──────────────────────────────
   The limit is fixed at 5 MB and the video is always over it,
   so dropping it shakes the box, says so in red and the file
   springs home. The picture always goes. */

/* ── inlined from lab/spring ──────────────────────── */
/* ── one spring, for everything that settles ───────────────
   The maths was already on this bench twice, copied by hand:
   Humidity's wheel and Brightness's column both accumulate
   velocity toward a target, damp it, and snap when both the
   delta and the velocity fall under 0.02. Two copies is a
   coincidence; five would be a policy, so it comes out here
   before the elastic blocks are written against it.

   The two shipped copies are deliberately NOT refactored onto
   this. They work, they are tuned, and rewriting the innards
   of two live components to prove a point about duplication
   is how a good afternoon becomes a bad one. This is the one
   new code uses.

   Frames, not milliseconds. `dt` is expressed in sixtieths of
   a second and the damping is RAISED to it rather than
   multiplied by it, so a dropped frame decays the same amount
   of energy as the two frames it replaced. Multiplying is the
   version that makes a spring behave differently on a busy
   page, which is the hardest kind of bug to see.

   The loop parks itself the moment the value has settled.
   CLAUDE.md is not complimentary about the one permanent
   requestAnimationFrame already on this bench and there is no
   case for five more. */

/* Read once, the way the wheel and the pill nav do. A
   preference, not a live input. */
const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const MAX = 20;
const MAX_BYTES = 20 * 1024 * 1024;

type F = { id: string; name: string; ext: string; size: number; tint: string };

const fmt = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function fromFile(file: File): F {
  const name = file.name.split(/[/\\]/).pop()?.trim() || "archivo";
  const dot = name.lastIndexOf(".");
  const ext = (dot > 0 ? name.slice(dot + 1) : "").toUpperCase() || "FILE";
  return { id: `${name}-${file.size}-${file.lastModified}`, name, ext, size: file.size, tint: "#465ab4" };
}

/* ── the file icon ─────────────────────────────────────────
   After Untitled UI's: a rounded page on a 40 grid with a thin
   grey outline and a folded corner, and the extension on a
   coloured label that sticks out past the page's left edge —
   the colour carries the kind before the word is read. */
function Page({ f, size = 40 }: { f: F; size?: number }) {
  return (
    <svg className="upl-page" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        className="upl-page-line"
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path className="upl-page-line" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width="29" height="16" x="1" y="18" rx="8" fill={f.tint} />
      {/* 9 units on the 40 grid: the mark is part of the drawing and
          scales with it, so its size lives here, not in the stylesheet */}
      <text x="15.5" y="29.1" textAnchor="middle" fontSize="9" className="upl-page-ext">{f.ext}</text>
    </svg>
  );
}

function Roll({ value }: { value: number }) {
  const s = String(Math.round(value));
  return (
    <span className="upl-roll" aria-label={`${s}%`}>
      {s.split("").map((d, i) => (
        <span key={`${s.length}-${i}`} className="upl-roll-col">
          <span className="upl-roll-strip" style={{ transform: `translateY(${-Number(d)}em)` }}>
            {"0123456789".split("").map((n) => <span key={n}>{n}</span>)}
          </span>
        </span>
      ))}
      %
    </span>
  );
}

type Phase = { kind: "idle" } | { kind: "up"; f: F; p: number } | { kind: "done"; f: F };

export type UploadDropzoneResult = { ok: true } | { ok: false; message: string };

export function UploadDropzone({
  /* how fast a file sends, 0..100 */
  speed = 50,
  /* how springy a file flies home, 0..100 */
  bounce = 40,
  corner = 20,
  disabled = false,
  onUpload,
}: {
  speed?: number;
  bounce?: number;
  corner?: number;
  disabled?: boolean;
  onUpload: (file: File) => Promise<UploadDropzoneResult>;
}) {
  const still = stillness();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [over, setOver] = useState(false);
  /* what the box says when it refuses — null while it is not */
  const [refuse, setRefuse] = useState<string | null>(null);
  const [gulp, setGulp] = useState(false);
  const [ghost, setGhost] = useState<F | null>(null);
  const zone = useRef<HTMLLabelElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const ghostEl = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const shake = useAnimationControls();
  const raf = useRef(0);
  const timers = useRef<number[]>([]);
  const queue = useRef<File[]>([]);
  const busy = useRef(false);
  const knobs = useRef({ speed });

  useEffect(() => {
    knobs.current = { speed };
  }, [speed]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    timers.current.forEach(clearTimeout);
  }, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const gulpOnce = () => {
    setGulp(true);
    later(() => setGulp(false), 460);
  };

  /* ── the pretend wire ──────────────────────────────────── */
  const send = (f: F, file: File) => {
    busy.current = true;
    if (still) {
      void runUpload(f, file);
      return;
    }
    setPhase({ kind: "up", f, p: 0 });
    let p = 0;
    let prev = 0;
    const secs = (4 - (clamp(knobs.current.speed, 0, 100) / 100) * 3.2) * (0.7 + Math.min(1, f.size / 5e6) * 0.6);
    const tick = (t: number) => {
      const dt = prev ? Math.min(0.05, (t - prev) / 1000) : 0;
      prev = t;
      /* uneven on purpose: a steady climb reads as a timer */
      p = Math.min(0.92, p + (dt / secs) * (0.4 + Math.random() * 1.2));
      setPhase({ kind: "up", f, p });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    void runUpload(f, file);
  };

  const runUpload = async (f: F, file: File) => {
    const result = await onUpload(file);
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    if (!result.ok) {
      busy.current = false;
      setPhase({ kind: "idle" });
      setRefuse(result.message);
      shake.start({ x: [0, -7, 6, -4, 2, 0], transition: { duration: 0.42 } });
      later(() => setRefuse(null), 1800);
      queue.current = [];
      return;
    }
    setPhase({ kind: "done", f });
    later(() => {
      setPhase({ kind: "idle" });
      busy.current = false;
      next();
    }, 1100);
  };

  const next = () => {
    const file = queue.current.shift();
    if (!file) {
      return;
    }
    take(file, false);
  };

  /* ── trying again ─────────────────────────────────────────
     The first refusal is plain. Try the same file again and the
     box starts to answer back, a new line each time, the last one
     repeating — until a file that fits goes through, which puts it
     back to being polite. */
  const refuseIt = () => {
    setRefuse(sellerCopy.documentTooLarge);
    shake.start({ x: [0, -7, 6, -4, 2, 0], transition: { duration: 0.42 } });
    later(() => setRefuse(null), 1800);
  };

  /* ── the suction ──────────────────────────────────────────
     From where it was let go to the box's middle, on an ease-IN:
     slow to leave and faster the nearer it gets, which is what
     reads as being pulled rather than as flying. It shrinks as it
     goes and draws out long in the direction of travel, then the
     box gulps and the upload takes its place. */
  const suck = (f: F, file: File, clientX: number, clientY: number) => {
    const el = ghostEl.current;
    const z = zone.current;
    const host = wrap.current;
    if (!el || !z || !host || still) {
      gulpOnce();
      send(f, file);
      return;
    }
    const hostBox = host.getBoundingClientRect();
    el.style.left = `${clientX - hostBox.left - 20}px`;
    el.style.top = `${clientY - hostBox.top - 20}px`;
    el.style.transform = "translate(0, 0) scale(1)";
    el.style.opacity = "1";
    setGhost(f);
    const a = { left: clientX - 20, top: clientY - 20, width: 40, height: 40 };
    const b = z.getBoundingClientRect();
    const tx = b.left + b.width / 2 - (a.left + a.width / 2);
    const ty = b.top + b.height / 2 - (a.top + a.height / 2);
    /* drawn out along the pull, never turned: a tile rotated to
       face its travel went upside down on the way up and spun on
       a short pull. Up or down it goes tall, sideways it goes
       wide, and a pull too short to have a direction only shrinks */
    const ux = Math.abs(tx);
    const uy = Math.abs(ty);
    const squeeze = Math.hypot(ux, uy) < 24 ? "scale(0.16)" : uy >= ux ? "scale(0.14, 0.34)" : "scale(0.34, 0.14)";
    requestAnimationFrame(() => {
      el.style.transition = "transform 380ms cubic-bezier(0.55, 0, 0.85, 0.3), opacity 300ms ease-in 80ms";
      el.style.transform = `translate(${tx}px, ${ty}px) ${squeeze}`;
      el.style.opacity = "0";
    });
    /* the upload starts as the tile goes down the hole, not after
       it has finished vanishing: waiting out the whole pull left a
       beat where the box sat empty, reading as a freeze */
    later(() => { gulpOnce(); }, 200);
    later(() => send(f, file), 220);
    later(() => {
      /* put the tile home unseen, ready to pop back later */
      el.style.transition = "none";
      el.style.transform = "";
      el.style.opacity = "0";
      setGhost(null);
    }, 390);
  };

  const take = (file: File, fromDrop: boolean, at?: { x: number; y: number }) => {
    if (disabled) {
      return;
    }
    const f = fromFile(file);
    if (file.size > MAX_BYTES) {
      refuseIt();
      return;
    }
    if (busy.current) {
      queue.current.push(file);
      return;
    }
    if (fromDrop && at) {
      suck(f, file, at.x, at.y);
      return;
    }
    gulpOnce();
    send(f, file);
  };

  const takeList = (list: File[], fromDrop: boolean, at?: { x: number; y: number }) => {
    if (list.length === 0 || disabled) {
      return;
    }
    const [first, ...rest] = list;
    if (!first) {
      return;
    }
    queue.current.push(...rest);
    take(first, fromDrop, at);
  };

  /* ── the box hugs the upload ─────────────────────────────
     While a file is in it the box closes in round the upload row
     — measured, because the row is as wide as its name — and
     grows a little when the tick arrives; back to idle it opens
     out to the full drop box again. Width and height, never a
     scale, so its corner stays the corner. It shrinks inside a
     slot of fixed size, so nothing below it moves. */
  useLayoutEffect(() => {
    const z = zone.current;
    const n = now.current;
    if (!z) return;
    if (phase.kind === "idle" || !n) {
      z.style.width = "";
      z.style.height = "";
      return;
    }
    z.style.width = `${n.offsetWidth + 32}px`;
    z.style.height = `${n.offsetHeight + 28}px`;
  }, [phase.kind]);

  const r = Math.max(0, corner);
  const up = phase.kind !== "idle";
  const f = phase.kind !== "idle" ? phase.f : null;
  const idleSay = disabled
    ? sellerCopy.documentsUploadDisabled
    : refuse
      ? refuse
      : over
        ? sellerCopy.dropToUpload
        : sellerCopy.dropDocument;

  return (
    <div
      className="upl"
      data-stroke="on"
      data-disabled={disabled ? true : undefined}
      style={{ "--upl-r": `${r}px`, "--upl-spring": `cubic-bezier(0.3, ${1 + (bounce / 100) * 0.9}, 0.4, 1)` } as CSSProperties}
    >
      <motion.div ref={wrap} animate={shake} className="upl-zone-wrap" style={{ position: "relative" }}>
        <label
          ref={zone}
          className="upl-zone"
          data-over={!disabled && over ? true : undefined}
          data-refuse={refuse ? true : undefined}
          data-busy={up || undefined}
          data-gulp={gulp || undefined}
          data-disabled={disabled ? true : undefined}
          aria-live="polite"
          onDragOver={(event) => {
            if (disabled) {
              return;
            }
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => {
            setOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            if (disabled) {
              return;
            }
            takeList([...event.dataTransfer.files], true, { x: event.clientX, y: event.clientY });
          }}
        >
          {!f ? (
            <>
              <span className="upl-icon"><UpIcon size={18} strokeWidth={2} /></span>
              <span className="upl-say">
                <b>{idleSay}</b>
                <span>{disabled ? sellerCopy.chooseDocumentsOff : `${sellerCopy.chooseDocuments} · ${MAX} MB`}</span>
              </span>
            </>
          ) : (
            <span className="upl-now" key={f.id} ref={now}>
              <Page f={f} size={36} />
              <span className="upl-text">
                <span className="upl-name">{f.name}</span>
                <span className="upl-meta">
                  {fmt(f.size)} · {phase.kind === "done" ? sellerCopy.documentUploaded : <Roll value={phase.kind === "up" ? phase.p * 100 : 0} />}
                </span>
                <span className="upl-track">
                  <span className="upl-bar" style={{ transform: `scaleX(${phase.kind === "up" ? phase.p : 1})` }} />
                </span>
              </span>
              {/* the tick's room is kept from the start, so the box
                  is its final size before the tick arrives */}
              <span className="upl-end">
                {phase.kind === "done" && <span className="upl-tick"><Check size={14} strokeWidth={2} /></span>}
              </span>
            </span>
          )}
          {disabled ? null : (
            <input
              type="file"
              multiple
              className="sr-only"
              disabled={up}
              onChange={(event) => {
                const chosen = event.target.files ? [...event.target.files] : [];
                event.target.value = "";
                takeList(chosen, false);
              }}
            />
          )}
        </label>
        <div ref={ghostEl} className="upl-file upl-ghost" data-gone={!ghost || undefined} aria-hidden>
          {ghost ? <Page f={ghost} /> : null}
        </div>
      </motion.div>
    </div>
  );
}
