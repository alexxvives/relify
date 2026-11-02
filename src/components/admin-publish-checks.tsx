import type { AdminPublishChecks, PublishChecklist } from "@/lib/publish-checklist";

/**
 * t76: a tiny chip beside the status in the admin banner instead of the big checklist card.
 * The tooltip (and screen-reader text) lists what is missing; approveProject still enforces it.
 */
export function PublishReadinessChip({ checks }: { checks: { seller: PublishChecklist; admin: AdminPublishChecks } }) {
  const missing = [...checks.seller.items, ...checks.admin.items].filter((item) => !item.done).map((item) => item.label);
  const ready = missing.length === 0;
  const label = ready ? "Lista para aprobar" : `Faltan ${missing.length} requisito${missing.length === 1 ? "" : "s"}`;
  const tip = ready ? "Cumple todo lo necesario para publicarla." : `Falta: ${missing.join(", ")}.`;

  return (
    <span
      tabIndex={0}
      title={tip}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-white ${
        ready ? "bg-[#2fc4b2] text-[#0b2b29]" : "bg-white/15 text-white ring-1 ring-white/40"
      }`}
    >
      {label}
      <span className="sr-only">. {tip}</span>
    </span>
  );
}
