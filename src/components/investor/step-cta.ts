/**
 * S29 (Alex): one look for the action that moves a process forward (Firmar NDA, Proceder al LOI, Firmar LOI,
 * Contrato…): a compact green pill. The secondary variant is for the same slot once there is
 * nothing left to do (e.g. a signed contract).
 */
export const stepCtaClass =
  "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#17663a] px-3 text-sm font-semibold text-white transition hover:bg-[#135530] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17663a] disabled:opacity-60";

export const stepSecondaryClass =
  "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4] transition hover:bg-[#f4f6fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4]";
