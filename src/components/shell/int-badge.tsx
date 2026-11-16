/**
 * INT environment tag. S28 (Alex): top right. On phones it closes the app bar's right-hand group; from 1024 px it is a
 * small tab hanging from the viewport's top-right corner, above the content padding so it never covers a control.
 */
export function IntBadge({ placement = "inline" }: { placement?: "inline" | "corner" }) {
  if (placement === "corner") {
    return (
      <span
        data-int-badge
        data-int-corner
        title="Entorno de pruebas"
        className="pointer-events-none fixed top-0 right-4 z-[90] hidden h-5 items-center rounded-b-md bg-orange-500 px-2 text-[10px] font-bold tracking-wide text-white shadow-sm lg:inline-flex"
      >
        INT
      </span>
    );
  }
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
