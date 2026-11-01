import { Landmark } from "lucide-react";

/** t74: marks a value prefilled from the mercantile registry import (SABI). */
export function RegistryBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Dato importado del registro mercantil (SABI). Puedes corregirlo si ha cambiado."
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e6f6f3] px-2 py-0.5 align-middle text-[11px] font-medium text-[#0f766e] ${className}`}
    >
      <Landmark className="size-3" aria-hidden />
      Fuente: registro (SABI)
    </span>
  );
}
