// Route-level loading state: keeps the app frame (dark sidebar + content area) on screen so
// side-menu navigation feels instant while the next section's server data streams in.
export function ShellSkeleton() {
  return (
    <div className="shell min-h-screen bg-public-paper" aria-busy="true" aria-live="polite">
      <aside className="shell-sidebar shell-dark" data-open="false" aria-hidden>
        <div className="flex w-full flex-col gap-3 px-4 pt-6">
          <div className="h-7 w-28 rounded-lg bg-white/10" />
          <div className="mt-2 h-12 rounded-xl bg-white/5" />
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="h-9 rounded-xl bg-white/5" />
          ))}
        </div>
      </aside>
      <main className="shell-main">
        <div className="shell-content animate-pulse px-4 py-8 sm:px-8">
          <span className="sr-only">Cargando…</span>
          <div className="h-8 w-56 rounded-lg bg-[#e7eaee]" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-[#eef1f5]" />
            <div className="h-28 rounded-2xl bg-[#eef1f5]" />
            <div className="h-28 rounded-2xl bg-[#eef1f5]" />
          </div>
          <div className="mt-6 h-72 rounded-2xl bg-[#eef1f5]" />
        </div>
      </main>
    </div>
  );
}
