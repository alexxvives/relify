"use client";

import { useEffect, useRef, useState } from "react";

type Status = "loading" | "ready" | "error";

/**
 * Renders a PDF with pdf.js onto canvases, so the document shows the same in
 * every browser (mobile Safari, Firefox, browsers without a PDF plugin).
 */
export function PdfPages({ src, title }: { src: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let destroy: (() => void) | undefined;

    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const response = await fetch(src, { credentials: "same-origin" });
        if (!response.ok) {
          throw new Error(`PDF ${response.status}`);
        }
        const task = pdfjs.getDocument({ data: new Uint8Array(await response.arrayBuffer()) });
        destroy = () => void task.destroy();
        const pdf = await task.promise;
        if (cancelled) {
          return;
        }
        container.replaceChildren();
        const width = Math.max(container.clientWidth - 2, 280);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        for (let index = 1; index <= pdf.numPages; index += 1) {
          const page = await pdf.getPage(index);
          if (cancelled) {
            return;
          }
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${width}px`;
          canvas.className = "mx-auto mb-3 block h-auto max-w-full rounded-md bg-white shadow-[0_1px_3px_rgba(28,39,64,0.12)] last:mb-0";
          canvas.setAttribute("aria-label", `${title} · página ${index} de ${pdf.numPages}`);
          canvas.setAttribute("role", "img");
          container.appendChild(canvas);
          const context = canvas.getContext("2d");
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
          }
        }
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src, title]);

  return (
    <div className="relative h-full overflow-y-auto rounded-lg border border-[#e6e9f0] bg-[#eef0f4] p-2 sm:p-3" data-pdf-status={status}>
      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-[#667085]" aria-busy="true">
          Cargando documento…
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[#667085]">
          <p>No se ha podido mostrar el documento aquí.</p>
          <a href={src} target="_blank" rel="noopener noreferrer" className="font-medium text-[#465ab4] underline">
            Abrir en una pestaña nueva
          </a>
        </div>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}
