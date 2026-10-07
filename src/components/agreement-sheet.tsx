export function AgreementSheet({ text }: { text: string }) {
  const [title, ...rest] = text.split("\n");
  const body = rest.join("\n").trim();

  return (
    <article className="overflow-hidden rounded-xl border border-[#e6e9f0] bg-white text-left">
      <header className="bg-[#1c2740] px-4 py-3 text-white">
        <p className="text-lg text-white italic" style={{ fontFamily: "var(--public-display)" }}>
          Releva
        </p>
        <p className="text-[11px] tracking-wide text-white/70">Documento confidencial</p>
      </header>
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-[#1c2740]">{title}</h3>
        <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-[#3d4a63]">{body}</p>
      </div>
    </article>
  );
}
