/**
 * INT environment pill. Inline next to the logo so it never covers header controls.
 */
export function IntBadge() {
  return (
    <span
      data-int-badge
      title="Entorno de pruebas"
      className="inline-flex h-5 shrink-0 items-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold tracking-wide text-white"
    >
      INT
    </span>
  );
}
