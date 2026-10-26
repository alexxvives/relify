/** Rows the admin has not seen yet (created after their previous visit to the page). */
export const adminNewRing = "border-[#9fb2f0] bg-[#f5f7ff] ring-1 ring-[#c9d6f5]";

export function NewPill() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e5484d] px-2 py-0.5 text-[11px] font-semibold leading-4 text-white">
      Nuevo
    </span>
  );
}
