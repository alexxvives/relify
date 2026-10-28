// Route-level loading state for the content area only: the sidebar frame comes from the
// persistent (app) layout and stays mounted while the next section's server data streams in.
export function ShellSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="h-8 w-56 rounded-lg bg-[#e7eaee]" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-2xl bg-[#eef1f5]" />
        <div className="h-28 rounded-2xl bg-[#eef1f5]" />
        <div className="h-28 rounded-2xl bg-[#eef1f5]" />
      </div>
      <div className="mt-6 h-72 rounded-2xl bg-[#eef1f5]" />
    </div>
  );
}
