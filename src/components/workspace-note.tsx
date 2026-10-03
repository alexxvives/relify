export function WorkspaceNote({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-[#2b3b4a]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748b]">{body}</p>
    </section>
  );
}
