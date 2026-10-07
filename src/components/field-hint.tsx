import { CircleHelp } from "lucide-react";

export function FieldHint({ text, align = "start" }: { text: string; align?: "start" | "end" }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex size-5 items-center justify-center rounded-full text-[#8b95a7] hover:text-[#465ab4]"
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-30 mb-2 hidden w-80 rounded-xl bg-[#1c2740] px-3 py-2 text-left text-xs leading-5 font-normal whitespace-pre-line text-white shadow-lg group-focus-within:block group-hover:block ${align === "end" ? "right-0" : "left-0"}`}
      >
        {text}
      </span>
    </span>
  );
}
