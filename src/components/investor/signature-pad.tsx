"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Eraser } from "lucide-react";
import { platformTermsCopy } from "@/lib/platform-terms";
import { useSigner } from "@/components/investor/signer-context";
import { IdentityDeclarationCheckbox } from "@/components/auth/identity-declaration";
import { authCopy } from "@/lib/auth-copy";
import { identityOnSign } from "@/lib/identity-declaration";
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
  collectIdentity = false,
}: {
  invalid: boolean;
  onChange: (dataUrl: string) => void;
  /** NDA (and first-time LOI) collect or confirm the signer DNI/NIE. LOI reuse skips the field. */
  collectIdentity?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  // Only a real stroke counts: a bare click must not produce a blank "signature".
  const moved = useRef(false);
  const [signed, setSigned] = useState(false);
  const { nationalIdMissing, nationalIdMasked } = useSigner();
  const identity = identityOnSign({ nationalIdMissing, collectIdentity });
  const askId = identity === "ask";
  const confirmStored = identity === "confirm";
  const declareIdentity = identity !== "skip";

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
      {askId ? (
        <label className="mb-3 block">
          <span className="text-sm font-medium text-[#1c2740]">{authCopy.nationalIdLabel}</span>
          <span className="mt-0.5 block text-xs text-[#5c6b78]">Aparece en el documento firmado. Lo guardamos en tu cuenta para no pedírtelo otra vez.</span>
          <Input
            name="nationalId"
            required
            autoComplete="off"
            inputMode="text"
            maxLength={12}
            placeholder={authCopy.nationalIdPlaceholder}
            className="mt-2 placeholder:normal-case"
          />
        </label>
      ) : null}
      {confirmStored ? (
        <p className="mb-2 text-xs leading-5 text-[#5c6b78]">
          {authCopy.nationalIdKeep}
          {nationalIdMasked ? ` ${nationalIdMasked}` : ""}
        </p>
      ) : null}
      {declareIdentity ? <IdentityDeclarationCheckbox /> : null}
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
