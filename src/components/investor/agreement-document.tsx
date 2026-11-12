/**
 * Renders a deal document (NDA, LOI…) built by deal-documents.ts as readable HTML in the same
 * style as the Relify agreement: date, parties paragraph, then numbered clauses.
 * The first line (the all-caps title) is dropped; the caller shows its own heading.
 */
export function AgreementDocument({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const date = lines.find((line) => line.startsWith("Fecha:"));
  const clauses = lines.filter((line) => /^\d+\.\s/.test(line)).map((line) => line.replace(/^\d+\.\s*/, ""));
  const preamble = lines.filter((line) => line !== date && !/^\d+\.\s/.test(line));

  return (
    <div className="text-[#1c2740]">
      {date ? <p className="text-xs font-medium tracking-wide text-[#667085] uppercase">{date}</p> : null}
      {preamble.map((line) => (
        <p key={line} className="mt-2 text-sm leading-6 text-[#475467]">
          {line}
        </p>
      ))}
      <ol className="mt-5 flex flex-col gap-4">
        {clauses.map((clause, index) => (
          <li key={clause} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
            <span aria-hidden className="pt-px text-sm font-semibold text-[#465ab4] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-sm leading-6 text-[#475467]">{clause}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
