import { XCircle } from "lucide-react";
import type { CancelledProcess } from "@/server/listCancelledProcesses";

function whoCancelled(by: CancelledProcess["cancelledBy"], viewer: "seller" | "investor"): string {
  if (by === null) {
    return "Proceso cancelado";
  }
  if (by === viewer) {
    return "Cancelaste este proceso";
  }
  return by === "seller" ? "La empresa canceló este proceso" : "El comprador canceló este proceso";
}

function when(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export function CancelledProcesses({ items, viewer }: { items: CancelledProcess[]; viewer: "seller" | "investor" }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="cancelled-processes" className="mt-6 space-y-3">
      <h2 id="cancelled-processes" className="text-sm font-semibold tracking-wide text-[#667085] uppercase">
        Procesos cancelados
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.accessId}
            className="flex flex-col gap-2 rounded-2xl border border-[#e4e7ec] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[#1c2740]">{item.title}</p>
              <p className="text-sm text-[#667085]">
                {whoCancelled(item.cancelledBy, viewer)} el <time dateTime={item.cancelledAt.toISOString()}>{when(item.cancelledAt)}</time>
              </p>
            </div>
            <span className="inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-full border border-[#f4c7c3] bg-[#fef3f2] px-3 text-xs font-semibold text-[#b42318] sm:self-auto">
              <XCircle className="size-3.5" aria-hidden />
              Cancelado
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
