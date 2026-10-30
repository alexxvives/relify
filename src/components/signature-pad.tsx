"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Eraser } from "lucide-react";
import { platformTermsCopy } from "@/lib/platform-terms";
import { useSigner } from "@/components/signer-context";
import { Input } from "@/components/ui/form";

function exportJpeg(canvas: HTMLCanvasElement): string {
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  const context = copy.getContext("2d");
  if (!context) {
    return "";
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, copy.width, copy.height);
  context.drawImage(canvas, 0, 0);
  return copy.toDataURL("image/jpeg", 0.85);
}

export function SignaturePad({
  invalid,
  onChange,
}: {
  invalid: boolean;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  // Only a real stroke counts: a bare click must not produce a blank "signature".
  const moved = useRef(false);
  const [signed, setSigned] = useState(false);
  const { nationalIdMissing } = useSigner();

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

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onChange("");
  }

  return (
    <div>
      {nationalIdMissing ? (
        <label className="mb-4 block">
          <span className="text-sm font-medium text-[#1c2740]">DNI o NIE del firmante</span>
          <span className="mt-0.5 block text-xs text-[#5c6b78]">Aparece en el documento firmado. Solo te lo pedimos una vez.</span>
          <Input
            name="nationalId"
            required
            autoComplete="off"
            inputMode="text"
            maxLength={12}
            placeholder="12345678Z"
            className="mt-2 placeholder:normal-case"
          />
        </label>
      ) : null}
      <p className="text-sm font-medium text-[#1c2740]">{platformTermsCopy.signLabel}</p>
      <div className="relative mt-2">
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className={
            invalid
              ? "releva-shake h-24 w-full sm:h-28 touch-none rounded-xl border-2 border-[#c0362c] bg-[#fff6f6]"
              : "h-24 w-full sm:h-28 touch-none rounded-xl border border-[#e7eaee] bg-[#fbfbfc]"
          }
          onPointerDown={(event) => {
            const pen = point(event);
            const canvas = canvasRef.current;
            const context = canvas?.getContext("2d");
            if (!pen || !canvas || !context) {
              return;
            }
            drawing.current = true;
            moved.current = false;
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
            const canvas = canvasRef.current;
            const context = canvas?.getContext("2d");
            if (!pen || !canvas || !context) {
              return;
            }
            context.lineTo(pen.x, pen.y);
            context.stroke();
            moved.current = true;
            if (!signed) {
              setSigned(true);
            }
          }}
          onPointerUp={() => {
            if (!drawing.current || !moved.current) {
              drawing.current = false;
              return;
            }
            drawing.current = false;
            const canvas = canvasRef.current;
            if (!canvas) {
              return;
            }
            const dataUrl = exportJpeg(canvas);
            if (dataUrl.length > 0) {
              setSigned(true);
              onChange(dataUrl);
            }
          }}
        />
        {signed ? null : (
          <p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-[#98a2b3]">
            {platformTermsCopy.signHint}
          </p>
        )}
        <button
          type="button"
          onClick={clearSignature}
          disabled={!signed}
          className="absolute top-2 right-2 z-20 inline-flex size-9 items-center justify-center rounded-lg border border-[#e7eaee] bg-white text-[#5c6b78] hover:text-[#1c2740] disabled:opacity-40"
          aria-label={platformTermsCopy.clearSignature}
        >
          <Eraser className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
