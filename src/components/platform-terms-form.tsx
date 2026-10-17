"use client";

import { useActionState, useRef, useState, type PointerEvent } from "react";
import { acceptPlatformTermsAction, type TermsState } from "@/app/acuerdo/actions";
import { platformTermsCopy } from "@/lib/platform-terms";

export function PlatformTermsForm() {
  const [state, action, pending] = useActionState<TermsState, FormData>(acceptPlatformTermsAction, null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  }

  function submit(event: { preventDefault: () => void; currentTarget: HTMLFormElement }) {
    const canvas = canvasRef.current;
    const field = event.currentTarget.elements.namedItem("signature");
    if (!signed || !canvas || !(field instanceof HTMLInputElement)) {
      event.preventDefault();
      return;
    }
    field.value = canvas.toDataURL("image/png");
  }

  return (
    <form action={action} onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="signature" value="" />
      <div>
        <p className="text-sm font-medium text-[#1c2740]">{platformTermsCopy.signLabel}</p>
        <p className="mt-1 text-sm text-[#5c6b78]">{platformTermsCopy.signHint}</p>
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className="mt-2 h-28 w-full touch-none rounded-xl border border-[#e7eaee] bg-[#fbfbfc]"
          onPointerDown={(event) => {
            const pen = point(event);
            const canvas = canvasRef.current;
            if (!pen || !canvas) {
              return;
            }
            const context = canvas.getContext("2d");
            if (!context) {
              return;
            }
            drawing.current = true;
            context.strokeStyle = "#1c2740";
            context.lineWidth = 2;
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(pen.x, pen.y);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!drawing.current) {
              return;
            }
            const pen = point(event);
            const context = canvasRef.current?.getContext("2d");
            if (!pen || !context) {
              return;
            }
            context.lineTo(pen.x, pen.y);
            context.stroke();
            setSigned(true);
          }}
          onPointerUp={() => {
            drawing.current = false;
          }}
        />
      </div>
      {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
      {!signed ? <p className="text-sm text-[#8a6112]">{platformTermsCopy.signRequired}</p> : null}
      <button
        type="submit"
        disabled={pending || !signed}
        className="inline-flex h-11 w-fit items-center rounded-full bg-[#1c2740] px-5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? platformTermsCopy.pending : platformTermsCopy.accept}
      </button>
    </form>
  );
}
