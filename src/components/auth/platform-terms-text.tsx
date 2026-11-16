import { Fragment } from "react";
import { platformTermsCopy } from "@/lib/platform-terms";

/** Renders `**bold**` markers as <strong>; everything else stays plain text. */
export function RichText({ text }: { text: string }) {
  return text.split("**").map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-[#1c2740]">
        {part}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

export function PlatformTermsText({ className = "" }: { className?: string }) {
  return (
    <ol className={`flex flex-col gap-5 ${className}`}>
      {platformTermsCopy.clauses.map((clause, index) => (
        <li key={clause.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
          <span aria-hidden className="pt-px text-sm font-semibold text-[#465ab4] tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[#1c2740]">{clause.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#475467]">
              <RichText text={clause.text} />
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
